import {BrowserRouter,Routes,Route} from "react-router-dom";
import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
import WelcomePage1 from "./Pages/WelcomePage/WelcomePage1";
import WelcomePage2 from "./Pages//WelcomePage/WelcomePage2";

import { UserProvider } from "./Components/UserContext";
import { DeviceProvider } from "./Components/DeviceContext";
import MapsComponent from "./Components/MapsComponent";
import ProtectedRoute from "./Components/ProtectedRoute";
import PublicRoute from "./Components/PublicRoute";

import SignUp  from "./Pages/LoginSignUpPage/SignUp";
import Login from "./Pages/LoginSignUpPage/Login";

import Monitor from "./Pages/MonitoringPage/Monitor"
import Settings from "./Pages/SettingsPage/Settings";
import ManageDevices from "./Pages/ManageDevices/ManageDevices";
import Profile from "./Pages/ProfilePage/Profile";
import Guide from "./Pages/GuidePage/Guide";


import './App.css';

function App() {
  return (
    <div className="App">
		<BrowserRouter>
			<UserProvider>
				<DeviceProvider>
					<Routes>
						<Route path="/" element={<PublicRoute><WelcomePage1/></PublicRoute>}></Route>
						<Route path="/WelcomePage2" element={<PublicRoute><WelcomePage2/></PublicRoute>}></Route>
						<Route path="/SignUp" element={<SignUp/>}></Route>
						<Route path="/Login" element={<PublicRoute><Login/></PublicRoute>}></Route>
						
						{/* Protected routes */}
						<Route path="/Monitor" element={<ProtectedRoute><><MapsComponent/><Monitor/></></ProtectedRoute>}></Route>
						<Route path="/Settings" element={<ProtectedRoute><Settings/></ProtectedRoute>}></Route>
						<Route path="/ManageDevices" element={<ProtectedRoute><ManageDevices/></ProtectedRoute>}></Route>
						<Route path="/Profile" element={<ProtectedRoute><Profile/></ProtectedRoute>}></Route>
						<Route path="/Guide" element={<ProtectedRoute><Guide/></ProtectedRoute>}></Route>

					</Routes>
				</DeviceProvider>
			</UserProvider>
		</BrowserRouter>
		<ToastContainer/>
    </div>
  );
}

export default App;
