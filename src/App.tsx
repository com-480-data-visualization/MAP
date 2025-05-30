import React from 'react';
import FlightGlobe from './components/FlightGlobe';
import TeamSection from './components/TeamSection';
import USMapSection from './components/USMapSection';
import ChordSection from './components/ChordSection';
import AirlineDelaySection from './components/AirlineDelaySection';
import Navbar from './components/Navbar';
import './App.css';
import LeaderboardSection from './components/LeaderboardSection';
import ParallelCoordinatesSection from './components/ParallelCoordinatesSection';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Navbar />

      <section id="home" className="hero-section">
        <FlightGlobe />
      </section>

      <div className="content-container">
        <div className="content-container-inside">
          <h1>Welcome!</h1>
          <p>
            <b>Flight delays</b> are a pervasive and frustrating experience for millions of travelers each year. These delays can come from a variety of factors, ranging from weather to operational inefficiencies, and impact not only <b>passengers</b>, but also <b>airlines</b>, <b>airports</b>, and <b>broader logistical networks</b>. Despite the scale of the issue, passengers often lack access to <b>comprehensive</b> and <b>interpretable</b> data that can help them make informed travel decisions. Moreover, stakeholders and professionals in the aviation sector struggle to identify <b>delay trends</b> at scale.
          </p>
          <p>That's why this website was designed!</p>
          <p>
            In this Data Visualization course project, we use a dataset of the <b>delay</b> information in <b>US</b> <b>airports</b> and <b>airlines</b> from 2009 to 2018, containing information on different types of <b>delays</b> across various <b>airports</b>, <b>airlines</b>, and flight routes. Our visualizations are useful for all stakeholders of the <b>flight industry</b>, including not only <b>passengers</b> but also airline and airport managers. Particularly, on our website, you are able to:
          </p>
          <ul>
            <li>
              🗺️ Visualize flight delays across the US using an <b>interactive map</b>.
            </li>
            <li>
              🏆 Explore <b>best- and worst-performing</b> airports and airlines.
            </li>
            <li>
              ✈️ Analyze the impact of <b>different factors</b> on flight delays.
            </li>
            <li>
              📊 Compare the <b>connections</b> between airports regarding delay information for better trip planning.
            </li>
          </ul>
          <p>
            May our visual insights offer a clearer understanding of the patterns behind delays, and maybe, even a few ideas for a smoother flight journey ahead!
          </p>
        </div>
      </div>

      <section id="us-map" className="content-section">
        <USMapSection />
      </section>

      <section id="leaderboard" className="content-section">
        <LeaderboardSection />
      </section>

      <section id="airline-delay" className="content-section">
        <AirlineDelaySection />
      </section>

      <section id="parallel-coordinates" className="content-section">
        <ParallelCoordinatesSection />
      </section>

      <section id="chord" className="content-section">
        <ChordSection />
      </section>

      <section id="team" className="content-section">
        <TeamSection />
      </section>
    </div>
  );
};

export default App;