import React from 'react';
import ParallelCoordinates from './ParallelCoordinates';
import './ParallelCoordinatesSection.css';

const ParallelCoordinatesSection: React.FC = () => {
  return (
    <div className="parallel-coordinates-section">
      <div className="section-content">
        <div className='section-header-container'>
          <div className="section-header">
            <h2>Delay Patterns and Performance Indicators 📈📉</h2>
            <p>
              Let's look at the data from another viewpoint! 🔬 This <b>parallel-coordinates</b> plot can help you explore relationships and patterns easier, while at the same time, enabling you to <b>filter</b> the data <b>aggregated over time</b> based on different ranges of performance indicators. Each <b>line</b> represents an airline or airport, color coded from green to red based on the average delay.
            </p>
            <p>
              You can select which airlines or airports to include or not include in the plot, from the <b>list</b> on the left. <b>Hovering</b> your mouse on each line shows you information about the airline or airport. Moreover, you can <b>drag your mouse</b> over the axes to <b>filter</b> the data based on the values of the performance indicators. This way, you can focus on <b>specific ranges</b> of values that interest you. To cancel your drag selection, click on somewhere else on the axis.
            </p>
            <p>
              Let's try playing with the dragging functionality to derive some insights for the ten selected airlines. First, let's try dragging over the <b>Weather Delay</b> axis from 0 to around 2.5. While these airlines had a lower average weather-related delay, the majority still had large mean arrival and departure delays, suggesting that unlike what some people might think, weather is not the only principal factor affecting flight delays. On the other hand, dragging over the top half of the <b>Departure Delay</b> axis keeps mainly airlines with a high late aircraft delay, showing it to be a significant factor in overall delays. Finally, dragging over the top half of the <b>Flights/Day</b> axis shows generally low security and NAS delays, which might be due to better infrastructure and resource management.
            </p>
          </div>
        </div>
        <ParallelCoordinates />
      </div>
    </div>
  );
};

export default ParallelCoordinatesSection; 