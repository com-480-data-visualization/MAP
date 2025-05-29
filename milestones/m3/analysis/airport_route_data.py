import pandas as pd
import os

def get_airport_route_data():
    data_path = 'milestones/m3/analysis/data'
    airports_path = 'milestones/m3/analysis/airports.csv'
    output_path = 'milestones/m3/analysis/output'
    os.makedirs(output_path, exist_ok=True)

    airports_out_path = os.path.join(output_path, 'airports-map.csv')
    routes_out_path = os.path.join(output_path, 'routes.csv')

    airports_meta = pd.read_csv(airports_path)[['IATA_CODE', 'AIRPORT', 'LATITUDE', 'LONGITUDE']]

    all_airport = []
    all_route = []

    year_files = [f for f in os.listdir(data_path) if f.endswith('.csv')]
    year_files.sort()
    delays = ['CARRIER_DELAY', 'WEATHER_DELAY', 'NAS_DELAY', 'SECURITY_DELAY', 'LATE_AIRCRAFT_DELAY']

    for year_file in year_files:
        print(f"reading {year_file}")
        path_to_file = os.path.join(data_path, year_file)
        year_df = pd.read_csv(path_to_file)
            
        year_df['FL_DATE'] = pd.to_datetime(year_df['FL_DATE'])
        year_df['Year_Month'] = year_df['FL_DATE'].dt.strftime('%Y-%m')
        year_df['DEP_DELAY'] = year_df['DEP_DELAY'].apply(lambda x: 0 if x < 0 else x)
        year_df[['DEP_DELAY'] + delays] = year_df[['DEP_DELAY'] + delays].map(lambda x: 0 if x < 0 else x)

        airport_org_date = year_df.groupby(['ORIGIN', 'Year_Month'])

        num_flights = airport_org_date.size().reset_index(name='NumFlights')
        avg_delay = airport_org_date['DEP_DELAY'].mean().reset_index(name='AverageDelay')
        
        airport_metrics = pd.merge(num_flights, avg_delay, on=['ORIGIN', 'Year_Month'])

        for delay in delays:
            avg_delay = airport_org_date[delay].mean().reset_index(name=f'AverageDelay_{delay}')
            airport_metrics = pd.merge(airport_metrics, avg_delay, on=['ORIGIN', 'Year_Month'])
        
        airport_metrics = pd.merge(airport_metrics, airports_meta, left_on='ORIGIN', right_on='IATA_CODE', how='left')
        airport_metrics = airport_metrics[['IATA_CODE', 'AIRPORT', 'LATITUDE', 'LONGITUDE', 'Year_Month', 'NumFlights', 'AverageDelay'] + [f'AverageDelay_{delay}' for delay in delays]]
        
        all_airport.append(airport_metrics)

        year_df['Route'] = year_df.apply(lambda row: tuple(sorted((row['ORIGIN'], row['DEST']))), axis=1)
        year_df['OriginSorted'] = year_df['Route'].apply(lambda x: x[0])
        year_df['DestinationSorted'] = year_df['Route'].apply(lambda x: x[1])

        route_grouped = year_df.groupby(['OriginSorted', 'DestinationSorted', 'Year_Month'])
        
        route_num_flights = route_grouped.size().reset_index(name='NumFlights')
        route_avg_delay = route_grouped['DEP_DELAY'].mean().reset_index(name='AverageDelay')
        
        route_metrics = pd.merge(route_num_flights, route_avg_delay, on=['OriginSorted', 'DestinationSorted', 'Year_Month'])
        route_metrics.rename(columns={'OriginSorted': 'Origin', 'DestinationSorted': 'Destination'}, inplace=True)
        route_metrics = route_metrics[['Origin', 'Destination', 'Year_Month', 'NumFlights', 'AverageDelay']]

        all_route.append(route_metrics)

    final_airports_df = pd.concat(all_airport, ignore_index=True)
    final_airports_df = final_airports_df[['IATA_CODE', 'AIRPORT', 'Year_Month', 'NumFlights', 'AverageDelay'] + [f'AverageDelay_{delay}' for delay in delays]]
    
    for col in ['AverageDelay'] + [f'AverageDelay_{delay}' for delay in delays]:
        final_airports_df[col] = final_airports_df[col].round(2)
    
    final_airports_df[['Year', 'Month']] = final_airports_df['Year_Month'].str.split('-', expand=True)
    final_airports_df.drop(columns=['Year_Month'], inplace=True)
    final_airports_df.drop(columns=['AIRPORT'], inplace=True)
    final_airports_df.to_csv(airports_out_path, index=False)

    final_routes_df = pd.concat(all_route, ignore_index=True)
    final_routes_df['AverageDelay'] = final_routes_df['AverageDelay'].round(2)
    
    final_routes_df[['Year', 'Month']] = final_routes_df['Year_Month'].str.split('-', expand=True)
    final_routes_df.drop(columns=['Year_Month'], inplace=True)
    final_routes_df.to_csv(routes_out_path, index=False)


def get_airline_data():
    data_path = 'milestones/m3/analysis/data'
    output_path = 'milestones/m3/analysis/output'
    os.makedirs(output_path, exist_ok=True)

    airlines_out_path = os.path.join(output_path, 'airlines-map.csv')

    all_airline = []

    year_files = [f for f in os.listdir(data_path) if f.endswith('.csv')]
    year_files.sort()
    delays = ['CARRIER_DELAY', 'WEATHER_DELAY', 'NAS_DELAY', 'SECURITY_DELAY', 'LATE_AIRCRAFT_DELAY']

    for year_file in year_files:
        print(f"reading {year_file}")
        path_to_file = os.path.join(data_path, year_file)
        year_df = pd.read_csv(path_to_file)
            
        year_df['FL_DATE'] = pd.to_datetime(year_df['FL_DATE'])
        year_df['Year_Month'] = year_df['FL_DATE'].dt.strftime('%Y-%m')
        year_df['DEP_DELAY'] = year_df['DEP_DELAY'].apply(lambda x: 0 if x < 0 else x)
        year_df[['DEP_DELAY'] + delays] = year_df[['DEP_DELAY'] + delays].map(lambda x: 0 if x < 0 else x)

        airline_date = year_df.groupby(['OP_CARRIER', 'Year_Month'])

        num_flights = airline_date.size().reset_index(name='NumFlights')
        avg_delay = airline_date['DEP_DELAY'].mean().reset_index(name='AverageDelay')
        
        airline_metrics = pd.merge(num_flights, avg_delay, on=['OP_CARRIER', 'Year_Month'])

        for delay in delays:
            avg_delay = airline_date[delay].mean().reset_index(name=f'AverageDelay_{delay}')
            airline_metrics = pd.merge(airline_metrics, avg_delay, on=['OP_CARRIER', 'Year_Month'])
        
        airline_metrics = airline_metrics[['OP_CARRIER', 'Year_Month', 'NumFlights', 'AverageDelay'] + 
                                          [f'AverageDelay_{delay}' for delay in delays]]
        
        all_airline.append(airline_metrics)

    final_airlines_df = pd.concat(all_airline, ignore_index=True)
    
    for col in ['AverageDelay'] + [f'AverageDelay_{delay}' for delay in delays]:
        final_airlines_df[col] = final_airlines_df[col].round(2)
    
    final_airlines_df[['Year', 'Month']] = final_airlines_df['Year_Month'].str.split('-', expand=True)
    final_airlines_df.drop(columns=['Year_Month'], inplace=True)
    final_airlines_df.rename(columns={'OP_CARRIER': 'Airline'}, inplace=True)
    final_airlines_df.to_csv(airlines_out_path, index=False)


def get_aggregated_airline_airport_data():
    data_path = 'milestones/m3/analysis/data'
    airports_path = 'milestones/m3/analysis/airports.csv'
    airlines_path = 'milestones/m3/analysis/airlines.csv'
    output_path = 'milestones/m3/analysis/output'
    os.makedirs(output_path, exist_ok=True)

    airlines_agg_path = os.path.join(output_path, 'airlines-aggregated.csv')
    airports_agg_path = os.path.join(output_path, 'airports-aggregated.csv')

    airports_meta = pd.read_csv(airports_path)[['IATA_CODE', 'AIRPORT']]
    airlines_meta = pd.read_csv(airlines_path)

    all_data = []

    year_files = [f for f in os.listdir(data_path) if f.endswith('.csv')]
    year_files.sort()
    delays = ['CARRIER_DELAY', 'WEATHER_DELAY', 'NAS_DELAY', 'SECURITY_DELAY', 'LATE_AIRCRAFT_DELAY']

    for year_file in year_files:
        print(f"reading {year_file}")
        path_to_file = os.path.join(data_path, year_file)
        year_df = pd.read_csv(path_to_file)
        
        year_df['FL_DATE'] = pd.to_datetime(year_df['FL_DATE'])
        year_df['DEP_DELAY'] = year_df['DEP_DELAY'].apply(lambda x: 0 if x < 0 else x)
        year_df['ARR_DELAY'] = year_df['ARR_DELAY'].apply(lambda x: 0 if x < 0 else x)
        year_df[['DEP_DELAY'] + delays] = year_df[['DEP_DELAY'] + delays].map(lambda x: 0 if x < 0 else x)
        
        all_data.append(year_df)

    combined_df = pd.concat(all_data, ignore_index=True)
    
    total_days = combined_df['FL_DATE'].value_counts().count()
    
    airline_grouped = combined_df.groupby('OP_CARRIER')
    
    airline_total_flights = airline_grouped.size().reset_index(name='TotalFlights')
    airline_cancelled_flights = airline_grouped['CANCELLED'].sum().reset_index(name='CancelledFlights')
    airline_avg_delay = airline_grouped['DEP_DELAY'].mean().reset_index(name='AverageDelay')
    airline_avg_arr_delay = airline_grouped['ARR_DELAY'].mean().reset_index(name='AverageArrDelay')
    
    airline_metrics = pd.merge(airline_total_flights, airline_cancelled_flights, on='OP_CARRIER')
    airline_metrics = pd.merge(airline_metrics, airline_avg_delay, on='OP_CARRIER')
    airline_metrics = pd.merge(airline_metrics, airline_avg_arr_delay, on='OP_CARRIER')
    
    airline_metrics['CancellationRate'] = (airline_metrics['CancelledFlights'] / airline_metrics['TotalFlights'] * 100).round(4)
    airline_metrics['AverageFlightsPerDay'] = (airline_metrics['TotalFlights'] / total_days).round(2)
    
    for delay in delays:
        avg_delay_by_cause = airline_grouped[delay].mean().reset_index(name=f'AverageDelay_{delay}')
        airline_metrics = pd.merge(airline_metrics, avg_delay_by_cause, on='OP_CARRIER')
    
    for col in ['AverageDelay', 'AverageArrDelay'] + [f'AverageDelay_{delay}' for delay in delays]:
        airline_metrics[col] = airline_metrics[col].round(2)
    
    airline_metrics.rename(columns={'OP_CARRIER': 'Airline'}, inplace=True)
    airline_metrics.drop(columns=['CancelledFlights'], inplace=True)
    airline_metrics = pd.merge(airline_metrics, airlines_meta, left_on='Airline', right_on='Code', how='left')
    airline_metrics = airline_metrics[['Airline', 'Description', 'TotalFlights', 'CancellationRate', 
                                       'AverageFlightsPerDay', 'AverageDelay', 'AverageArrDelay'] + 
                                      [f'AverageDelay_{delay}' for delay in delays]]
    airline_metrics.rename(columns={'Description': 'Name'}, inplace=True)
    airline_metrics.to_csv(airlines_agg_path, index=False)

    airport_grouped = combined_df.groupby('ORIGIN')
    
    airport_total_flights = airport_grouped.size().reset_index(name='TotalFlights')
    airport_cancelled_flights = airport_grouped['CANCELLED'].sum().reset_index(name='CancelledFlights')
    airport_avg_delay = airport_grouped['DEP_DELAY'].mean().reset_index(name='AverageDelay')
    airport_avg_arr_delay = airport_grouped['ARR_DELAY'].mean().reset_index(name='AverageArrDelay')
    
    airport_metrics = pd.merge(airport_total_flights, airport_cancelled_flights, on='ORIGIN')
    airport_metrics = pd.merge(airport_metrics, airport_avg_delay, on='ORIGIN')
    airport_metrics = pd.merge(airport_metrics, airport_avg_arr_delay, on='ORIGIN')

    airport_metrics['CancellationRate'] = (airport_metrics['CancelledFlights'] / airport_metrics['TotalFlights'] * 100).round(4)
    airport_metrics['AverageFlightsPerDay'] = (airport_metrics['TotalFlights'] / total_days).round(2)
        
    for delay in delays:
        avg_delay_by_cause = airport_grouped[delay].mean().reset_index(name=f'AverageDelay_{delay}')
        airport_metrics = pd.merge(airport_metrics, avg_delay_by_cause, on='ORIGIN')
    
    for col in ['AverageDelay', 'AverageArrDelay'] + [f'AverageDelay_{delay}' for delay in delays]:
        airport_metrics[col] = airport_metrics[col].round(2)
    
    airport_metrics.drop(columns=['CancelledFlights'], inplace=True)
    
    
    airport_metrics = pd.merge(airport_metrics, airports_meta, left_on='ORIGIN', right_on='IATA_CODE', how='inner')
    airport_metrics = airport_metrics[['IATA_CODE', 'AIRPORT', 'TotalFlights', 'CancellationRate', 'AverageFlightsPerDay', 
                                       'AverageDelay', 'AverageArrDelay'] + [f'AverageDelay_{delay}' for delay in delays]]
    
    airport_metrics.to_csv(airports_agg_path, index=False)


def _interpolate_file(file_path: str, id_cols: list[str]):
    df = pd.read_csv(file_path)

    df["Date"] = pd.to_datetime(df["Year"].astype(str).str.zfill(4) + "-" + df["Month"].astype(str).str.zfill(2) + "-01")

    numeric_cols = [c for c in df.select_dtypes(include=["number"]).columns if c not in {"Year", "Month"}]

    overall_min, overall_max = df["Date"].min(), df["Date"].max()
    full_range = pd.date_range(start=overall_min, end=overall_max, freq="MS")

    processed_frames: list[pd.DataFrame] = []
    for key, group in df.groupby(id_cols):
        key_vals = key if isinstance(key, tuple) else (key,)
        grp = group.set_index("Date").reindex(full_range)
        for col, val in zip(id_cols, key_vals):
            grp[col] = val
        grp[numeric_cols] = grp[numeric_cols].interpolate(method="linear")
        grp[numeric_cols] = grp[numeric_cols].fillna(method="ffill").fillna(method="bfill")

        grp["Year"] = grp.index.year.astype(int)
        grp["Month"] = grp.index.month.astype(int)
        processed_frames.append(grp.reset_index(drop=True))

    full_df = pd.concat(processed_frames, ignore_index=True)
    full_df.sort_values(by=id_cols + ["Year", "Month"], inplace=True)

    for col in numeric_cols:
        full_df[col] = full_df[col].round(2)

    full_df.to_csv(file_path, index=False)


def interpolate_missing_data():
    output_path = "milestones/m3/analysis/output"
    files_info = [
        ("airlines-map.csv", ["Airline"]),
        ("airports-map.csv", ["IATA_CODE"]),
        ("routes.csv", ["Origin", "Destination"]),
    ]
    for fname, id_cols in files_info:
        _interpolate_file(os.path.join(output_path, fname), id_cols)


if __name__ == '__main__':
    get_aggregated_airline_airport_data()
    get_airport_route_data()
    get_airline_data()
    interpolate_missing_data()