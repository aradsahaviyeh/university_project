import { useEffect, useState } from "react";
import axios from 'axios';

export default function GetAccounts(){
    let [accounts, setAccounts] = useState([]);

    useEffect(
        () => {
            axios.get('http://localhost:8000/accounts/')
            .then(response => setAccounts(response.data))
            .catch(error => console.log(error))
        }
        , [])
    
    return (
        <div className="flex justify-center items-center h-screen bg-blue-950">
            <div className="h-120 w-180 bg-gray-200 rounded-lg">
                <ul className="p-5">
                {accounts.map((account) => (
                    <>
                    <li key={account.id} className="p-2 flex items-center bg-gray-400 rounded-lg my-2 hover:bg-gray-500">
                        <img src={account.avatar} alt=""  className="h-20 w-20"/>
                        <h4>
                        {account.username}
                        </h4>
                        <small>
                            {account.is_online}
                        </small>
                    </li>
                    <hr />
                    </>
                ))}
                </ul>
            </div>
        </div>
    )    
}