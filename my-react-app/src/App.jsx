import { BrowserRouter, Routes, Route } from "react-router-dom";
import GetAccounts from "./components/Accounts";
import Login from "./components/login";
import Chats from './components/Chats'
import ChatDetail from "./components/ChatDetail";
import Contacts from "./components/Contacts";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/accounts/" element={<GetAccounts/>}/>
        <Route path="/login/" element={<Login/>}/>
        <Route path="/contacts/" element={<Contacts/>}/>
        <Route path="/chats/" element={<Chats/>}/>
        <Route path="/chat/:chatId" element={<ChatDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;