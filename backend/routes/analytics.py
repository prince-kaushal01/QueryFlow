import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import dotenv
import os
import supabase
import plotly.express as px

dotenv.load_dotenv(dotenv_path=r"C:\Users\palya\Desktop\extra folder\backend\.env")

router = APIRouter()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_client = supabase.create_client(supabase_url, supabase_key)


def convert_numpy(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    return obj


@router.get("/analytics/summary", response_model=Dict[str, Any])
async def get_summary_statistics() -> Dict[str, Any]:
    """
    Calculate summary statistics for queries stored in the 'queries' table.

    Returns:
        Dict[str, Any]: A dictionary containing summary statistics and plotly figures.
    """
    # Guard against missing data
    response = supabase_client.table("queries").select("*").execute()
    data = getattr(response, "data", None) or response.get("data") if isinstance(response, dict) else response.data
    df = pd.DataFrame(data or [])

    if df.empty:
        # Return empty/default metrics if no data
        empty_fig = px.scatter(pd.DataFrame({"x": [], "y": []}), x="x", y="y")
        return {
            "queries_by_channel": empty_fig.to_dict(),
            "query_type_distribution": empty_fig.to_dict(),
            "response_time_trend": empty_fig.to_dict(),
            "priority_breakdown": empty_fig.to_dict(),
            "total_queries": 0,
            "avg_response_time": None,
            "resolution_rate": 0,
            "resolved_today": 0
        }

    # Convert to datetime
    df["createdAt"] = pd.to_datetime(df["createdAt"], errors="coerce")
    df["updatedAt"] = pd.to_datetime(df["updatedAt"], errors="coerce")

    # Only include rows having both timestamps
    df = df.dropna(subset=["createdAt", "updatedAt"])

    # -------------------------------
    # 1️⃣ TOTAL QUERIES
    # -------------------------------
    total_queries = len(df)

    # -------------------------------
    # 2️⃣ AVG RESPONSE TIME
    # -------------------------------
    df["response_time"] = df["updatedAt"] - df["createdAt"]
    # add response_time_hours for plotting (float hours)
    df["response_time_hours"] = df["response_time"].dt.total_seconds() / 3600.0
    avg_response_time = df["response_time"].mean()

    # -------------------------------
    # 3️⃣ RESOLUTION RATE
    # resolution_rate = resolved_queries / total_queries
    # resolved = status in ["answered", "closed", "resolved"]
    # -------------------------------
    resolved_statuses = ["answered", "closed", "resolved"]

    resolved_queries = df[df["status"].isin(resolved_statuses)]
    resolution_rate = len(resolved_queries) / total_queries if total_queries > 0 else 0

    # -------------------------------
    # 4️⃣ RESOLVED TODAY
    # -------------------------------
    today = pd.Timestamp.now().normalize()  # midnight today
    tomorrow = today + pd.Timedelta(days=1)

    resolved_today = resolved_queries[
        (resolved_queries["updatedAt"] >= today) &
        (resolved_queries["updatedAt"] < tomorrow)
    ]

    resolved_today_count = len(resolved_today)
    channel_counts = df["channel"].value_counts().reset_index()
    channel_counts.columns = ["channel", "count"]

    fig_channel = px.bar(
        channel_counts,
        x="channel",
        y="count",
        # title="Queries by Channel",
        text_auto=True
    )

    # -------------------------------------------------------------
    # 2️⃣ Query Type Distribution → PIE CHART
    # -------------------------------------------------------------
    type_counts = df["type"].value_counts().reset_index()
    type_counts.columns = ["type", "count"]

    fig_types = px.pie(
        type_counts,
        names="type",
        values="count",
        # title="Query Type Distribution",
        hole=0.35
    )

    # -------------------------------------------------------------
    # 3️⃣ Response Time Trend → SMOOTH LINE CHART
    # -------------------------------------------------------------
    # Sort by createdAt
    df_sorted = df.sort_values("createdAt")

    # Convert datetime into a human-readable ISO string for chart X-axis
    df_sorted["createdAt_iso"] = df_sorted["createdAt"].dt.strftime("%Y-%m-%d %H:%M:%S")

    # Plot with clean date labels
    fig_response_trend = px.line(
        df_sorted,
        x="createdAt_iso",           # FIXED AXIS
        y="response_time_hours",
        markers=True
    )

    # Smooth curve
    fig_response_trend.update_traces(
    line=dict(shape="spline", smoothing=1.3)
)

    # -------------------------------------------------------------
    # 4️⃣ Priority Breakdown → HORIZONTAL BAR CHART
    # -------------------------------------------------------------
    priority_counts = df["priority"].value_counts().reset_index()
    priority_counts.columns = ["priority", "count"]

    fig_priority = px.bar(
        priority_counts,
        x="count",
        y="priority",
        # title="Priority Breakdown",
        orientation="h",
        text_auto=True
    )
    fig_channel_dict = convert_numpy(fig_channel.to_dict())
    fig_types_dict = convert_numpy(fig_types.to_dict())
    fig_response_dict = convert_numpy(fig_response_trend.to_dict())
    fig_priority_dict = convert_numpy(fig_priority.to_dict())

    return {
    "queries_by_channel": fig_channel_dict,
    "query_type_distribution": fig_types_dict,
    "response_time_trend": fig_response_dict,
    "priority_breakdown": fig_priority_dict,
    "total_queries": total_queries,
    "avg_response_time": str(avg_response_time),
    "resolution_rate": resolution_rate,
    "resolved_today": resolved_today_count
}
