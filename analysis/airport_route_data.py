import pandas as pd
import os

def get_airport_route_data():
    data_path = 'analysis/data'
    airports_path = 'analysis/airports.csv'
    output_path = 'analysis/output'
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
        year_df[['ARR_DELAY'] + delays] = year_df[['ARR_DELAY'] + delays].map(lambda x: 0 if x < 0 else x)

        airport_org_date = year_df.groupby(['ORIGIN', 'Year_Month'])

        num_flights = airport_org_date.size().reset_index(name='NumFlights')
        avg_delay = airport_org_date['ARR_DELAY'].mean().reset_index(name='AverageDelay')
        
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
        route_avg_delay = route_grouped['ARR_DELAY'].mean().reset_index(name='AverageDelay')
        
        route_metrics = pd.merge(route_num_flights, route_avg_delay, on=['OriginSorted', 'DestinationSorted', 'Year_Month'])
        route_metrics.rename(columns={'OriginSorted': 'Origin', 'DestinationSorted': 'Destination'}, inplace=True)
        route_metrics = route_metrics[['Origin', 'Destination', 'Year_Month', 'NumFlights', 'AverageDelay']]

        all_route.append(route_metrics)

    final_airports_df = pd.concat(all_airport, ignore_index=True)
    final_airports_df = final_airports_df[['IATA_CODE', 'AIRPORT', 'Year_Month', 'NumFlights', 'AverageDelay'] + [f'AverageDelay_{delay}' for delay in delays]]
    final_airports_df[['Year', 'Month']] = final_airports_df['Year_Month'].str.split('-', expand=True)
    final_airports_df.drop(columns=['Year_Month'], inplace=True)
    final_airports_df.rename(columns={'AIRPORT': 'AirportName'}, inplace=True)
    final_airports_df.to_csv(airports_out_path, index=False)

    final_routes_df = pd.concat(all_route, ignore_index=True)
    final_routes_df[['Year', 'Month']] = final_routes_df['Year_Month'].str.split('-', expand=True)
    final_routes_df.drop(columns=['Year_Month'], inplace=True)
    final_routes_df.to_csv(routes_out_path, index=False)


if __name__ == '__main__':
    get_airport_route_data() 