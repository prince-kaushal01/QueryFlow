import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import dotenv
import os
import supabase

dotenv.load_dotenv(dotenv_path=r"C:\Users\palya\Desktop\extra folder\backend\.env")

router = APIRouter()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_client = supabase.create_client(supabase_url, supabase_key)


response = supabase_client.table("queries").select("*").execute()

class StatusUpdate(BaseModel):
    id: str
    status: str

class ReplyModel(BaseModel):
    id: str
    reply: str
    resolve_after_reply: bool = False



@router.get("/queries/summary", response_model=Dict[str, Any])
async def get_queries_statistics():
    """
    Calculate summary statistics for a list of numerical data points.

    Args:
        data (List[Dict[str, float]]): A list of dictionaries containing numerical data.

    Returns:
        Dict[str, Any]: A dictionary containing summary statistics.
    """
    response = supabase_client.table("queries").select("*").execute()
    df= pd.DataFrame(response.data)
    queries = df.to_dict(orient="records")
    # print(queries)
    total_queries = len(df)
    df["createdAt"] = pd.to_datetime(df["createdAt"])
    df["updatedAt"] = pd.to_datetime(df["updatedAt"])

    df['response_time'] = df['updatedAt'] - df['createdAt']
    avg_response_time = df['response_time'].mean()
    df.groupby('status').size()
    status_counts = df['status'].value_counts().to_dict()
    print(status_counts)
    new_queries= status_counts["new"] if "new" in status_counts else 0
    print(new_queries)
    in_progress_queries= status_counts["in_progress"] if "in_progress" in status_counts else 0
    urgent_queries= status_counts["urgent"] if "urgent" in status_counts else 0
    return {
        "queries": queries,
        "total_queries": total_queries,
        # "average_response_time": str(avg_response_time),
        "status_counts": status_counts,
        "new_queries": new_queries,
        "in_progress_queries": in_progress_queries,
        "urgent_queries": urgent_queries
    }
# get_summary_statistics(data=response.data)
@router.get("/queries/search", response_model=Dict[str, Any])
async def search_queries(keyword: str) -> List[Dict[str, Any]]:
    """
    Search for queries containing a specific keyword.

    Args:
        keyword (str): The keyword to search for.   
    Returns:
        List[Dict[str, Any]]: A list of queries containing the keyword.
    """
    df = pd.DataFrame(response.data)
    matching_queries = df[df.apply(lambda row: row.astype(str).str.contains(keyword, case=False).any(), axis=1)]
    matching_queries.to_dict(orient="records")
    return {
        "total_matching_queries": len(matching_queries),
        "matching_queries": matching_queries.to_dict(orient="records")
    }
# ==========================================================
# UPDATE STATUS (queries table only + history log)
# ==========================================================
@router.post("/queries/update-status")
async def update_status(payload: StatusUpdate):
    try:
        # Fetch the row
        row = (
            supabase_client
            .table("queries")
            .select("*")
            .eq("id", payload.id)
            .single()
            .execute()
        )
        if not row.data:
            raise HTTPException(status_code=404, detail="Query not found")

        # History log (short)
        history = row.data.get("history") or []
        history.append({
            "action": f"Status changed to {payload.status}",
            "timestamp": str(pd.Timestamp.utcnow())
        })

        # Update query record
        updated = (
            supabase_client
            .table("queries")
            .update({
                "status": payload.status,
                "updatedAt": str(pd.Timestamp.utcnow()),
                "history": history
            })
            .eq("id", payload.id)
            .execute()
        )

        return {"success": True, "updated": updated.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ==========================================================
# SEND REPLY (save in query_replies + update status + log)
# ==========================================================
@router.post("/queries/send-reply")
async def send_reply(payload: ReplyModel):
    try:
        # Fetch original query
        query_row = (
            supabase_client
            .table("queries")
            .select("*")
            .eq("id", payload.id)
            .single()
            .execute()
        )
        if not query_row.data:
            raise HTTPException(status_code=404, detail="Query not found")

        # Insert into query_replies
        reply_insert = (
            supabase_client
            .table("query_replies")
            .insert({
                "query_id": payload.id,
                "sender_type": "admin",
                "message": payload.reply,
                "createdat": str(pd.Timestamp.utcnow())   # FIXED
            })
            .execute()
        )

        # Determine status
        new_status = "closed" if payload.resolve_after_reply else "in_progress"

        # Update status only (no need to update history now)
        updated_query = (
            supabase_client
            .table("queries")
            .update({
                "status": new_status,
                "updatedAt": str(pd.Timestamp.utcnow())
            })
            .eq("id", payload.id)
            .execute()
        )

        return {
            "success": True,
            "reply_added": reply_insert.data,
            "query_updated": updated_query.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ==========================================================
# GET FULL THREAD (query + replies)

# @router.get("/queries/{id}/full")
async def get_full_thread(id: str):
    try:
        # ===============================
        # 1. Fetch QUERY
        # ===============================
        q = (
            supabase_client
            .table("queries")
            .select("*")
            .eq("id", id)
            .single()
            .execute()
        ).data

        if not q:
            raise HTTPException(status_code=404, detail="Query not found")

        # ===============================
        # 2. Fetch REPLIES
        # ===============================
        replies = (
            supabase_client
            .table("query_replies")
            .select("*")
            .eq("query_id", id)
            .order("createdAt", ascending=True)
            .execute()
        ).data

        # ===============================
        # 3. Build UNIFIED CHAT HISTORY
        # ===============================

        unified = []

        # (A) SYSTEM HISTORY from queries.history
        #     Example: status changes, created events, etc.
        for h in (q.get("history") or []):
            unified.append({
                "sender_type": "system",
                "message": h.get("action", ""),
                "createdAt": h.get("timestamp")
            })

        # (B) USER FIRST MESSAGE (MAIN QUERY)
        unified.append({
            "sender_type": "user",
            "message": q["content"],
            "createdAt": q["createdAt"]
        })

        # (C) REPLIES (ADMIN / USER)
        for r in replies:
            unified.append({
                "sender_type": r["sender_type"],
                "message": r["message"],
                "createdAt": r["createdAt"]
            })

        # ===============================
        # 4. Sort final thread by timestamp ascending
        # ===============================
        unified_sorted = sorted(unified, key=lambda x: x["createdAt"])

        return {
            "query": q,
            "history": unified_sorted,
            "replies": replies
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
