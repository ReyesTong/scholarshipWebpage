import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import {
  Scrypt,
  ScryptProvider,
  SensiletSigner,
  ContractCalledEvent,
  ByteString,
  hash160,
  PubKey,
  toHex,
  findSig,
  SignatureResponse
} from "scrypt-ts";
import axios  from 'axios';
import { Voting } from './contracts/voting';
import artifact from '../artifacts/voting.json';

Voting.loadArtifact(artifact);

// `npm run deploycontract` to get deployment transaction id
const contract_id = {
  /** The deployment transaction id */
  txId: "0871080448710bb3962ca9eb001d8cc3b5d652fa6f17c4779c5d4ab87c6019a4",
  /** The output index */
  outputIndex: 0,
};

interface ApiResponse {
  GPA: number;
  DigestGPA:ByteString,
  DigestPK:ByteString,
            
  Signatures:{
    Rabin:{
      Sig_S:bigint,
      Sig_U:ByteString
    },
    RabinPK:{
      Sig_S:bigint,
      Sig_U:ByteString
    }
  }

}

function App() {
  const [ScholarshipContract, setContract] = useState<scholarship>();
  const signerRef = useRef<SensiletSigner>();
  const [error, setError] = React.useState("");
  const [GPA, setGpa] = useState<number | null>(null);
  const [msgGPA, setMsgGPA] = useState<ByteString | null>('null');
  const [msgPK, setMsgPK] = useState<ByteString | null>('null');
  const [sigGPA, setSigGPA] = useState<ApiResponse['Signatures']['Rabin'] | null>(null);
  const [sigPK, setSigPK] = useState<ApiResponse['Signatures']['RabinPK'] | null>(null);
  const [username, setUsername] = useState("");
  
  async function Payment(e:any){
    const singer = signerRef.current as SensiletSigner;
    const url = `http://16.171.36.57:5000/api/gpa?name=${username}`;
    //const url = `http://localhost:5000/api/gpa?name=${username}`;
    axios.get<ApiResponse>(url)
    .then(response => {
      const data = response.data;
      // 在这里使用数据
      setGpa(data.GPA);
      setMsgGPA(data.DigestGPA);
      setMsgPK(data.DigestPK);
      setSigGPA(data.Signatures.Rabin);
      setSigPK(data.Signatures.RabinPK);
      const fetchedGPA = data.GPA;
      // Check if the fetched GPA is greater than 3.5
      if (fetchedGPA > 3.5) {
        window.alert("Congratulations! You have a GPA above 3.5. You will get a scholarship!");
      } else {
        window.alert("We regret to inform you that your GPA is below 3.5. Keeping punching!");
      }
    })
    .catch(error => {
      // 处理错误
      console.error(error);
     });
    if(ScholarshipContract && singer) {
      const {isAuthenticated, error} = await singer.requestAuth();
      if(!isAuthenticated){
        throw new Error(error);
      }
      const GPAmsg = msgGPA;
      const PKmag = msgPK;
      const sigsGPA = sigGPA?.Sig_S;
      const siguGPA = sigGPA?.Sig_U;
      const sigsPK = sigPK?.Sig_S;
      const siguPK = sigPK?.Sig_U;
      await ScholarshipContract.connect(singer);
      ScholarshipContract.methods.unlock(GPAmsg,PKmag,{sigsGPA,siguGPA},{sigsPK,siguPK})
      
    }
  }
  return (
    <div className="center">
      <h1>Welcome to the Scholarship Application</h1>
      <div>
        <label htmlFor="username">Enter Username: </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={Payment}>Make A Query</button>
      </div>
      {error && <p>{error}</p>}
    </div>
  );
}

export default App;
