import './App.scss';
import Jambo from './assets/jambojunction.png';
import JamboForm from './JamboForm';
import JamboList from './JamboList';
import Navigation from './Navigation';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import JamboDetail from './JamboDetail';

function App() {
  return (
    <BrowserRouter>
      <div>
        <img src={motoko} className="logo" alt="Jambo Junction" />
      </div>
      <h1>Jambo Junction</h1>
      <Navigation />
      <div className="content">
        <Routes>
          <Route path="/" element={<JamboList />} />
          <Route path="/newJambo" element={<JamboForm />} />
          <Route path="/viewJambo/:id" element={<JamboDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
