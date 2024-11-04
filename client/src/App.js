import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import TextEditor from "./components/TextEditor";
import AccessDenied from "./components/AccessDenied";
import NotFound from './components/NotFound';
import {
    BrowserRouter as Router,
    Routes,
    Route,
	Navigate,
} from "react-router-dom"

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Navigate to="/login" />} />
				<Route path="/login" element={<Login/>} />
				<Route path="/signup" element={<Signup/>} />
				<Route path="/home" element={<Home/>} />
				<Route path="/documents/:id" element={<TextEditor/>} />
				<Route path="/access-denied" element={<AccessDenied/>} />
				<Route path="*" element={<NotFound/>} />
			</Routes>
		</Router>
	)
}

export default App;
