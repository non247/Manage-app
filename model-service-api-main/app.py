import joblib
import pandas as pd
import numpy as np
import requests
from flask import Flask, request, jsonify
from catboost import CatBoostRegressor
from datetime import datetime
from flask_cors import CORS

# --- Load global artifacts ---
model_path = "catboost_model_soldperday.cbm"
scaler_temporal_path = "scaler_temporal.pkl"
scaler_new_features_path = "scaler_new_features.pkl"

# Load the CatBoost Regressor model
loaded_cb_model = CatBoostRegressor().load_model(model_path)

# Load the scalers
loaded_scaler_temporal = joblib.load(scaler_temporal_path)
loaded_scaler_new_features = joblib.load(scaler_new_features_path)

print("Model and scalers loaded successfully.")

# --- Prepare historical_df_for_lags from original df ---
# The original 'df' contains unscaled TotalSold and Duration_Days, and original Flavor.
# This is crucial for calculating accurate SoldPerDay, lags, and rolling means.
# Create a copy to avoid modifying the original df unnecessarily
df = pd.read_excel("icecream_sales_data.xlsx")
X_train_time = pd.read_excel("X_train_time.xlsx")


# --- Define global lists for feature consistency ---
# Get all unique flavors from the original DataFrame for consistent one-hot encoding
all_flavors = sorted(df["Flavor"].unique().tolist())

# Get the exact column order from X_train_time for consistent input to the model
# X_train_time is available in the kernel state.
# Note: This assumes X_train_time's columns correctly reflect all engineered features.
# Need to ensure that the preprocessing function generates features in this exact order.
X_train_columns = X_train_time.columns.tolist()
print("Global variables for flavors and feature order defined.")


# --- Global Variables (loaded artifacts and historical data) ---
# These are assumed to be loaded once when the application starts.
# For a real deployment, these would be loaded outside the Flask app definition
# in a more persistent way (e.g., Gunicorn worker, Docker entrypoint).

# --- Prepare historical_df_for_lags from original df for lag/rolling/aggregate features ---
# Ensure this DataFrame mirrors the feature engineering steps up to SoldPerDay, TotalAllFlavors, FlavorShare
historical_df_for_lags_full = df.copy()

historical_df_for_lags_full["SoldPerDay"] = (
    historical_df_for_lags_full["TotalSold"]
    / historical_df_for_lags_full["Duration_Days"]
)
historical_df_for_lags_full["SoldPerDay"] = (
    historical_df_for_lags_full["SoldPerDay"]
    .replace([np.inf, -np.inf], np.nan)
    .fillna(0)
)

# Calculate TotalAllFlavors directly based on original df logic
total_sales_per_period_lookup = (
    historical_df_for_lags_full.groupby(["StartDate", "EndDate"])["TotalSold"]
    .sum()
    .reset_index()
)
total_sales_per_period_lookup.rename(
    columns={"TotalSold": "TotalAllFlavors"}, inplace=True
)

# Merge TotalAllFlavors back into historical_df_for_lags_full
historical_df_for_lags_full = pd.merge(
    historical_df_for_lags_full,
    total_sales_per_period_lookup,
    on=["StartDate", "EndDate"],
    how="left",
)
historical_df_for_lags_full["TotalAllFlavors"] = historical_df_for_lags_full[
    "TotalAllFlavors"
].fillna(0)

# Calculate FlavorShare
historical_df_for_lags_full["FlavorShare"] = (
    historical_df_for_lags_full["TotalSold"]
    / historical_df_for_lags_full["TotalAllFlavors"]
)
historical_df_for_lags_full["FlavorShare"] = (
    historical_df_for_lags_full["FlavorShare"]
    .replace([np.inf, -np.inf], np.nan)
    .fillna(0)
)

# Sort by StartDate and Flavor, essential for correct lag/rolling calculations in preprocessing
historical_df_for_lags_full.sort_values(by=["StartDate", "Flavor"])

# Pre-calculate global means for fallbacks if specific historical data isn't found
global_mean_total_all_flavors = historical_df_for_lags_full["TotalAllFlavors"].mean()
global_mean_flavorshare_by_flavor = historical_df_for_lags_full.groupby("Flavor")[
    "FlavorShare"
].mean()

print("Historical DataFrame for comprehensive feature lookup prepared.")

# --- Define global lists for feature consistency ---
# all_flavors and X_train_columns are available from previous kernel state

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# --- Holiday Detection ---
HOLIDAY_URL = "https://myhora.com/calendar/ical/holiday.aspx?2569.json"


def load_holiday_dates(url: str) -> set:
    """Fetch holiday dates from myhora.com and return a set of 'YYYY-MM-DD' strings.
 
    NOTE: The API returns malformed JSON (objects separated by `}{` instead of `},{`),
    so we extract dates directly from the raw text using regex instead of json parsing.
    """
    import re
    holiday_dates = set()
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        # Use regex to extract all DTSTART dates — avoids broken JSON parsing
        raw_dates = re.findall(r'"DTSTART;VALUE=DATE"\s*:\s*"(\d{8})"', resp.text)
        for raw_date in raw_dates:
            formatted = f"{raw_date[:4]}-{raw_date[4:6]}-{raw_date[6:8]}"
            holiday_dates.add(formatted)
        print(f"Loaded {len(holiday_dates)} holiday dates from myhora.com.")
    except Exception as e:
        print(f"Warning: Could not load holiday data: {e}")
    return holiday_dates


HOLIDAY_DATES: set = load_holiday_dates(HOLIDAY_URL)


def check_is_holiday(start_date: datetime, end_date: datetime) -> int:
    """Return 1 if any date within [start_date, end_date] (inclusive) is a public holiday."""
    from datetime import timedelta
    current = start_date
    while current <= end_date:
        if current.strftime("%Y-%m-%d") in HOLIDAY_DATES:
            return 1
        current += timedelta(days=1)
    return 0


def _preprocess_input_data(
    flavor, is_holiday, duration_days_input, start_date, end_date
):
    # 1. Basic Validation
    try:
        if flavor not in all_flavors:
            raise ValueError(f"Invalid flavor: {flavor}. Must be one of {all_flavors}")

        if start_date > end_date:
            raise ValueError("Start date cannot be after end date.")
        calculated_duration = (end_date - start_date).days + 1
        if calculated_duration != duration_days_input:
            duration_days_input = calculated_duration

    except ValueError as e:
        raise ValueError(f"Invalid input data: {e}")

    # Create a base DataFrame for this single input instance
    input_df = pd.DataFrame(
        {
            "IsHoliday": [is_holiday],
            "Duration_Days": [duration_days_input],
            "StartDate": [start_date],
            "EndDate": [end_date],
        }
    )

    # 2. One-Hot Encode Flavor
    for f in all_flavors:
        input_df[f"Flavor_{f}"] = flavor == f

    # 3. Extract Temporal Features
    input_df["Start_Month"] = input_df["StartDate"].dt.month
    input_df["Start_DayOfWeek"] = input_df["StartDate"].dt.dayofweek
    input_df["Start_DayOfYear"] = input_df["StartDate"].dt.dayofyear

    input_df["End_Month"] = input_df["EndDate"].dt.month
    input_df["End_DayOfWeek"] = input_df["EndDate"].dt.dayofweek
    input_df["End_DayOfYear"] = input_df["EndDate"].dt.dayofyear

    input_df["Start_Quarter"] = input_df["StartDate"].dt.quarter
    input_df["Start_WeekOfYear"] = (
        input_df["StartDate"].dt.isocalendar().week.astype(int)
    )
    input_df["Start_DayOfMonth"] = input_df["StartDate"].dt.day

    input_df["End_Quarter"] = input_df["EndDate"].dt.quarter
    input_df["End_WeekOfYear"] = input_df["EndDate"].dt.isocalendar().week.astype(int)
    input_df["End_DayOfMonth"] = input_df["EndDate"].dt.day

    input_df["Start_IsMonthEnd"] = input_df["StartDate"].dt.is_month_end.astype(int)
    input_df["End_IsMonthEnd"] = input_df["EndDate"].dt.is_month_end.astype(int)

    # 4. Compute Lag and Rolling Mean Features for SoldPerDay
    historical_flavor_data = historical_df_for_lags_full[
        historical_df_for_lags_full["Flavor"] == flavor
    ]
    historical_flavor_data = historical_flavor_data[
        historical_flavor_data["StartDate"] < start_date
    ].sort_values(by="StartDate", ascending=False)

    input_df["SoldPerDay_Lag1"] = (
        historical_flavor_data["SoldPerDay"].iloc[0]
        if len(historical_flavor_data) > 0
        else 0
    )
    input_df["SoldPerDay_Lag2"] = (
        historical_flavor_data["SoldPerDay"].iloc[1]
        if len(historical_flavor_data) > 1
        else 0
    )
    input_df["SoldPerDay_Lag3"] = (
        historical_flavor_data["SoldPerDay"].iloc[2]
        if len(historical_flavor_data) > 2
        else 0
    )

    if len(historical_flavor_data) > 0:
        rolling_series = historical_flavor_data["SoldPerDay"]
        input_df["SoldPerDay_RollingMean3"] = (
            rolling_series.head(3).mean() if len(rolling_series.head(3)) > 0 else 0
        )
        input_df["SoldPerDay_RollingMean5"] = (
            rolling_series.head(5).mean() if len(rolling_series.head(5)) > 0 else 0
        )
    else:
        input_df["SoldPerDay_RollingMean3"] = 0
        input_df["SoldPerDay_RollingMean5"] = 0

    # 5. Compute Aggregate Features
    historical_period_total = total_sales_per_period_lookup[
        (total_sales_per_period_lookup["StartDate"] == start_date)
        & (total_sales_per_period_lookup["EndDate"] == end_date)
    ]["TotalAllFlavors"]
    input_df["TotalAllFlavors"] = (
        historical_period_total.iloc[0]
        if not historical_period_total.empty
        else global_mean_total_all_flavors
    )

    input_df["FlavorShare"] = global_mean_flavorshare_by_flavor.get(flavor, 0)

    input_df.drop(columns=["StartDate", "EndDate"])

    # 6. Feature Scaling
    features_for_temporal_scaling = [
        "Duration_Days",
        "Start_Quarter",
        "Start_WeekOfYear",
        "Start_DayOfMonth",
        "End_Quarter",
        "End_WeekOfYear",
        "End_DayOfMonth",
    ]
    input_df[features_for_temporal_scaling] = loaded_scaler_temporal.transform(
        input_df[features_for_temporal_scaling]
    )

    features_for_new_scaling = [
        "SoldPerDay_Lag1",
        "SoldPerDay_Lag2",
        "SoldPerDay_Lag3",
        "SoldPerDay_RollingMean3",
        "SoldPerDay_RollingMean5",
        "TotalAllFlavors",
        "FlavorShare",
    ]
    input_df[features_for_new_scaling] = loaded_scaler_new_features.transform(
        input_df[features_for_new_scaling]
    )

    # 7. Ensure Feature Order and Return
    final_features = input_df[X_train_columns].copy()
    return (
        final_features.values,
        duration_days_input,
    )


@app.route("/api/getSaleForecastData", methods=["POST"])
def predict_soldperday():
    try:
        raw_input_json = request.get_json()
        if not raw_input_json:
            return jsonify({"status": "error", "message": "Invalid JSON input."}), 400

        # Extract date inputs — is_holiday is auto-detected from the holiday calendar
        start_date_str = raw_input_json["start_date"]
        end_date_str = raw_input_json["end_date"]

        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")

        # Auto-detect holiday flag: 1 if start_date OR end_date is a public holiday
        is_holiday = check_is_holiday(start_date, end_date)

        calculated_duration = (end_date - start_date).days + 1

        results = {}
        for flavor in all_flavors:
            preprocessed_data, used_duration_days = _preprocess_input_data(
                flavor, is_holiday, calculated_duration, start_date, end_date
            )
            forecasted_soldperday = loaded_cb_model.predict(preprocessed_data)[0]
            forecasted_total_sold = forecasted_soldperday * used_duration_days
            results[flavor] = {
                "flavor": flavor,
                "forecasted_soldperday": float(forecasted_soldperday),
                "forecasted_totalsold": float(forecasted_total_sold),
            }

        return (
            jsonify(
                {
                    "status": "success",
                    "date_range": {
                        "start_date": start_date_str,
                        "end_date": end_date_str,
                        "calculated_duration": calculated_duration,
                        "is_holiday": is_holiday,
                    },
                    "results": list(results.values()),
                }
            ),
            200,
        )

    except ValueError as ve:
        return jsonify({"status": "error", "message": str(ve)}), 400
    except Exception as e:
        return (
            jsonify(
                {"status": "error", "message": f"An unexpected error occurred: {e}"}
            ),
            500,
        )


if __name__ == "__main__":
    # For local development: app.run(debug=True, port=5000)
    # For deployment, use a production-ready WSGI server like Gunicorn.
    app.run(host="127.0.0.1", port=5000, debug=True)
