import Login from "./Login";
import Signup from "./Signup";
import Home from "./Home";
import TextEditor from "./TextEditor";
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
			</Routes>
		</Router>
	)
}

export default App;
