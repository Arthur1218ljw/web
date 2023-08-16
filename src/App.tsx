import React, { useEffect, useRef, useState } from "react";
import logo from './logo.svg';
import './App.css';
import scriptpng from '../public/sCrypt.png'
import auctionpng from '../public/auction.png'
import { Button ,MenuProps, Menu,  Avatar, Space, Popover} from 'antd';
import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import { UserOutlined } from '@ant-design/icons';
import Market from './Market';
import Info from './Info';
import CreateAuction from './CreateAuction';
import MyAuction from './MyAuction';
import MyBid from './MyBid';

import {
  Scrypt,
  ScryptProvider,
  SensiletSigner,
  ContractCalledEvent,
  ByteString,
  DefaultProvider,  toHex, PubKey 
} from "scrypt-ts";
import { AuctionProject } from "./contracts/auctionProject";


// `npm run deploycontract` to get deployment transaction id
const contract_id = {
  /** The deployment transaction id */
  txId: "b3c3bb3de3f5996d9f8aef7b456dd516c87dfab78d57f45513b76cffaa45398f",
  /** The output index */
  outputIndex: 0,
};

function byteString2utf8(b: ByteString) {
  return Buffer.from(b, "hex").toString("utf8");
}

function App() {
  const [auctionProjectContract, setContract] = useState<AuctionProject>();
  const signerRef = useRef<SensiletSigner>();

  const [userAddress, setUserAddress] = useState("");
  const [userBalance, setUserBalance] = useState("");
  const [imageUrl, setImageUrl] = useState<string>();

  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState<{
    txId: string;
    candidate: string;
  }>({
    txId: "",
    candidate: "",
  });

  const [contentView, setContentView] = useState(<Market></Market>);

  const items: MenuProps['items'] = [
    {
      label: 'Marketplace',
      key: 'market',
      icon: <AppstoreOutlined />,
    },
    {
      label: 'My Bid',
      key: 'bid',
      icon: <AppstoreOutlined />,
    },
    {
      label: 'My Auction',
      key: 'my',
      icon: <AppstoreOutlined />,
    },
    {
      label: 'Create Auction',
      key: 'create',
      icon: <AppstoreOutlined />,
    },
    {
      label: 'Info',
      key: 'info',
      icon: <AppstoreOutlined />,
    },
  ];

  const jumpToMyAuction =  () => {
    setCurrent('my');
    setContentView(<MyAuction></MyAuction>);
  };

  const refreshInfo =  () => {
    const address = localStorage.getItem('address');
    login(address);
  };

  const [current, setCurrent] = useState('market');

  const clickMenu: MenuProps['onClick'] = (e) => {
    console.log('click ', e);
    setCurrent(e.key);
    if (e.key=='market') {
      setContentView(<Market></Market>)
    }else if(e.key=='info'){
      setContentView(<Info appfun={refreshInfo}></Info>) 
    }else if(e.key=='create'){
      setContentView(<CreateAuction appfun={jumpToMyAuction}></CreateAuction>) 
    }else if(e.key=='my'){
      setContentView(<MyAuction></MyAuction>) 
    }else if(e.key=='bid'){
      setContentView(<MyBid></MyBid>) 
    }
  };

  async function login(address) {
    fetch("http://localhost/index.php/api/index/login",{
        headers:{'Content-Type': 'application/json'},
        "body": JSON.stringify({
          "address": address
        }),
        "method": "POST",
      }).then(response => {
        return response.json()
      }).then((res)=>{
          const data = res.data
          setImageUrl(data.image)
      })
  }

  async function initUserAddress(signer) {
    const { isAuthenticated, error } = await signer.requestAuth();
    console.log(isAuthenticated,error);
    if (!isAuthenticated) {
      throw new Error(error);
    }
    const userAddress = await signer.getDefaultAddress();
    setUserAddress(toHex(userAddress))
 
  }
  

  useEffect(() => {
    const provider = new ScryptProvider();
    const signer = new SensiletSigner(provider);
    signer.connect(provider)
    signerRef.current = signer;

    const subscription = Scrypt.contractApi.subscribe(
      {
        clazz: AuctionProject,
        id: contract_id,
      },
      (event: ContractCalledEvent<AuctionProject>) => {
        setSuccess({
          txId: event.tx.id,
          candidate: event.args[0] as ByteString,
        });
        setContract(event.nexts[0]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };

  }, []);



  async function voting(e: any) {
    const signer = signerRef.current as SensiletSigner;
    if (auctionProjectContract && signer) {
      console.log(signer)
      const { isAuthenticated, error } = await signer.requestAuth();
      console.log(isAuthenticated, error)
      if (!isAuthenticated) {
        throw new Error(error);
      }
      // await auctionProjectContract.connect(signer);
     const userAddress = await signer.getDefaultAddress();
      signer.getBalance(userAddress).then(balance => {
        console.log("balance:",balance)
        console.log(balance.confirmed , balance.unconfirmed)
      }).catch((err) => {
        console.error(`catch: ${err}`);
      });
    }
  }


  
  async function linkWallet(e: any) {
    const signer = signerRef.current as SensiletSigner;
    if (signer) {
      const { isAuthenticated, error } = await signer.requestAuth();
      if (!isAuthenticated) {
        throw new Error(error);
      }
     const userAddress = await signer.getDefaultAddress();
     setUserAddress(toHex(userAddress))
     login(toHex(userAddress));
     localStorage.setItem('address',toHex(userAddress));
      // signer.getBalance(userAddress).then(balance => {
      //   console.log("balance:",balance)
      //   console.log(balance.confirmed , balance.unconfirmed)
      // }).catch((err) => {
      //   console.error(`catch: ${err}`);
      // });
    }
  }
  function logout(){
    localStorage.removeItem('address')
    window.location.reload()
  }
  const personInfo = (
    <div id="personInfo">
      <p onClick={logout}>Logout</p>
    </div>
  );

  if(userAddress!=""){
    return (
      <div className="App">
        <Menu onClick={clickMenu} selectedKeys={[current]} mode="horizontal" items={items} />
        <span className="address">{userAddress}</span>
        <Space className="avatar" wrap size={16}>
        <Popover content={personInfo} trigger="hover">
          <Avatar src={<img src={imageUrl} alt="avatar" />} size="small" icon={<UserOutlined />}/>
        </Popover>
        </Space>
        
        {contentView}

          {/* <img src={logo} className="App-logo" alt="logo" />
          <img src={scriptpng}/>
          <button onClick={voting}>点我</button> */}
          {/* <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a> */}
      </div>
    );
  }else{
    return (
      <div className="App">
        <img id="logo" src={auctionpng} alt="logo" />
        <div>
          <Button type="primary" onClick={linkWallet}>Link with Wallet</Button>
        </div>
          {/* <img src={logo} className="App-logo" alt="logo" />
          <img src={scriptpng}/>
          <button onClick={voting}>点我</button> */}
          {/* <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a> */}
      </div>
    );
  }
}

export default App;
