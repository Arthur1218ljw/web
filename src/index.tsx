import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { bsv } from "scryptlib";
import { Scrypt } from 'scrypt-ts'
import { Auction } from './contracts/auction';
var artifact = require('../artifacts/auction.json');
Auction.loadArtifact(artifact);
Scrypt.init({
  // https://docs.scrypt.io/advanced/how-to-integrate-scrypt-service#get-your-api-key
  apiKey: 'testnet_e4bM1Hrz6bsfcQP6q4g8JcrmxJVzJMwTmkQx8gsFHhZtMG98',
  network: bsv.Networks.testnet
})

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
