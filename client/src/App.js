import Menu from "./Menu";
import TextEditor from "./TextEditor";
import {
    BrowserRouter as Router,
    Routes,
    Route
} from "react-router-dom"

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Menu/>} />
				<Route path="/documents/:id" element={<TextEditor/>} />
			</Routes>
		</Router>
	)
}

export default App;
