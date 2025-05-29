import React, { useState } from 'react';
import { FaExpand, FaCompress } from 'react-icons/fa';
import ChordDiagram from './ChordDiagram';
import './ChordSection.css';

const ChordSection: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`chord-section ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="chord-section-content">
        <div className="chord-section-text">
          <h2>Airport Route Visualization 🧭</h2>
          <p>
            Finally, let's focus again on the <b>routes</b> between the airports in the US!
          </p>
          <p>
            The following interactive chord diagram visualizes the <b>connections</b> between airports based on flight routes, highlighting the <b>average delay times</b> (through the colors) and the <b>number of flights</b> (through the thickness of the connections). It is useful to understand the <b>interconnectedness</b> of the US air travel network, especially between the airports the stakeholders aim to investigate.
          </p>
          <p>
            Use the <b>fullscreen</b> button to be able to interact with the diagram and add or remove airports from the visualization. You can also <b>hover</b> over the airport names and connections to see more details.
          </p>
          <p>
            Interacting with the plot gives us interesting insights into the delay patterns over time. For example, by tapping on the <b>play</b> button on the bottom, and observing the changes in the connections, we see an increase in <b><span style={{color: "red"}}>red</span></b> and <b><span style={{color: "orange"}}>orange</span></b> colors around <b>April</b> to <b>August</b> of most years, mostly focusing on <b>June</b> and <b>July</b>, indicating higher delays during the certain seasons throughout the year. We see increases in the <b><span style={{color: "red"}}>red</span></b> and <b><span style={{color: "orange"}}>orange</span></b> colors, even in less crowded months, if you add certain airports to the visualization; try adding <b>Detroit Metropolitan</b> to the <b>January 2009</b> time period to see how the <b><span style={{color: "orange"}}>orange</span></b> color is introduced to an otherwise <b><span style={{color: "rgb(9, 143, 232)"}}>blue</span></b> and <b><span style={{color: "green"}}>green</span></b> diagram.
          </p>
        </div>

        <div className="chord-section-visualization">
          <ChordDiagram isFullscreen={isFullscreen} />
          
          {!isFullscreen && (
            <div className="chord-controls-overlay">
              <button className="action-btn fullscreen-btn" onClick={toggleFullscreen}>
                <FaExpand />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isFullscreen && (
        <button 
          className="exit-fullscreen-btn"
          onClick={toggleFullscreen} 
          aria-label="Exit fullscreen"
        >
          <FaCompress />
        </button>
      )}
    </div>
  );
};

export default ChordSection; 