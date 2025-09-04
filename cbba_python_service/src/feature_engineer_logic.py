# cbba_python_service/src/feature_engineer_logic.py

import pandas as pd
import numpy as np
import json
import time

TIME_WINDOW_SECONDS = 10 # This should match the window used in main.py / frontend submission

def engineer_features(raw_biometric_events, raw_db_events):
    """
    Extracts combined biometric and database event features from raw event lists.
    raw_biometric_events: List of dicts from frontend.
    raw_db_events: List of dicts representing privileged DB actions.
    """
    if not raw_biometric_events and not raw_db_events:
        # Return a DataFrame with all-zero features if no data
        return pd.DataFrame([
            {
                'avg_dwell_time': 0, 'std_dwell_time': 0,
                'avg_flight_time': 0, 'std_flight_time': 0,
                'key_press_rate': 0, 'mouse_move_count': 0,
                'mouse_click_rate': 0, 'std_mouse_speed': 0,
                'db_event_count': 0, 'avg_query_size_kb': 0,
                'bulk_export_count': 0
            }
        ])

    # --- Process Biometric Data ---
    raw_df = pd.DataFrame(raw_biometric_events)
    if not raw_df.empty:
        raw_df['time'] = pd.to_datetime(raw_df['time'], unit='s')
        key_presses = raw_df[raw_df['type'] == 'key_press']
        key_releases = raw_df[raw_df['type'] == 'key_release']
    else:
        key_presses = pd.DataFrame()
        key_releases = pd.DataFrame()

    dwell_times = []
    if not key_presses.empty and not key_releases.empty:
        for i, press_event in key_presses.iterrows():
            try:
                # Find the first release for the same key *after* the press
                release_event = key_releases[
                    (key_releases['key'] == press_event['key']) &
                    (key_releases['time'] >= press_event['time'])
                ].iloc[0]
                dwell_time = (release_event['time'] - press_event['time']).total_seconds()
                dwell_times.append(dwell_time)
            except IndexError:
                pass

        # Flight times: time between consecutive key releases
        key_release_times_unix = key_releases['time'].astype(np.int64) // 10**9
        flight_times = np.diff(key_release_times_unix).tolist()
    else:
        flight_times = []

    mouse_moves = raw_df[raw_df['type'] == 'mouse_move'].sort_values(by='time')
    mouse_speeds = []
    if len(mouse_moves) > 1:
        mouse_moves['time_diff'] = mouse_moves['time'].diff().dt.total_seconds()
        mouse_moves['x_diff'] = mouse_moves['x'].diff()
        mouse_moves['y_diff'] = mouse_moves['y'].diff()
        mouse_moves['distance'] = np.sqrt(mouse_moves['x_diff']**2 + mouse_moves['y_diff']**2)
        mouse_moves['speed'] = mouse_moves['distance'] / mouse_moves['time_diff']
        # Filter out infinite speeds (due to 0 time_diff)
        mouse_speeds = mouse_moves['speed'].replace([np.inf, -np.inf], np.nan).dropna().tolist()


    # --- Process Database Event Data ---
    db_df = pd.DataFrame(raw_db_events)
    db_features = {
        'db_event_count': len(db_df) if not db_df.empty else 0,
        'avg_query_size_kb': db_df['query_size_kb'].mean() if not db_df.empty else 0,
        'bulk_export_count': len(db_df[db_df['event_type'] == 'BULK_DATA_EXPORT']) if not db_df.empty else 0
    }

    # Aggregate all features
    features = {
        'avg_dwell_time': [np.mean(dwell_times) if dwell_times else 0],
        'std_dwell_time': [np.std(dwell_times) if dwell_times else 0],
        'avg_flight_time': [np.mean(flight_times) if len(flight_times) > 0 else 0],
        'std_flight_time': [np.std(flight_times) if len(flight_times) > 0 else 0],
        'key_press_rate': [len(key_presses) / TIME_WINDOW_SECONDS],
        'mouse_move_count': [len(mouse_moves)],
        'mouse_click_rate': [len(raw_df[raw_df['type'] == 'mouse_click']) / TIME_WINDOW_SECONDS],
        'std_mouse_speed': [np.std(mouse_speeds) if mouse_speeds else 0],
        **db_features
    }

    return pd.DataFrame(features)