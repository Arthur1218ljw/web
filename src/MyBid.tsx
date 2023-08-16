import React, { useEffect, useRef, useState } from "react";
import './MyBid.css';
import scriptpng from '../public/sCrypt.png'
import { Button ,MenuProps,Modal,InputNumber,Space, message} from 'antd';
import moment from "moment";
import { findSig, MethodCallOptions } from 'scrypt-ts'

import {
  Scrypt,
  ScryptProvider,
  SensiletSigner,
  ContractCalledEvent,
  ByteString,
  DefaultProvider,  toHex, PubKey 
} from "scrypt-ts";
import { Auction } from "./contracts/auction";
import e from "express";

function byteString2utf8(b: ByteString) {
  return Buffer.from(b, "hex").toString("utf8");
}


function MyBid() {
  const [auctionContract, setAuctionContract] = useState<Auction>();
  const signerRef = useRef<SensiletSigner>();

  const [userAddress, setUserAddress] = useState("");
  const [userBalance, setUserBalance] = useState("");
  const [contractId, setContractId] = useState("");

  const [bidMin, setBidMin] = useState(1);
  const [bidAmount, setBidAmount] = useState(1);

  const [contentView, setContentView] = useState(<div></div>);
  const [inputDisplay, setInputDisplay] = useState('none');

  const [record, setRecord] = useState({image:'',title:'',deadline:0,sn:'',txid:'',amount:0,id:0,status:''});

  const [messageApi, contextHolder] = message.useMessage();

  const [current, setCurrent] = useState('mail');

  const onClick: MenuProps['onClick'] = (e) => {
    console.log('click ', e);
    setCurrent(e.key);
  };

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
    getAuctions();
    const provider = new ScryptProvider();
    const signer = new SensiletSigner(provider);
    signer.connect(provider)
    signerRef.current = signer;
  }, []);
  

  async function getAuctions() {
    var address = localStorage.getItem('address')
    fetch(process.env.REACT_APP_APIHOST+"/api/index/mybid",
    {
      headers:{'Content-Type': 'application/json'},
      "body": JSON.stringify({
        "address": address
      }),
      "method": "POST",
    }).then(response => {
      return response.json()
    }).then((res)=>{
      const data = res.data
      const listItem: JSX.Element[] = data.map((item) => 
      <div className="listitem" key={item.id}  onClick={() => {showModal(item)}}>
        <div style={{ position: "relative" }}>
          <img className="itemimg" src={item.image}/>
          <p style={{ position: "absolute", bottom: 0, right: '10px'}}>{Number(item.amount)}</p>
          <p style={{ position: "absolute", top: 0, right: '0px', rotate: '45deg'}}>{item.status}</p>
        </div>
        <p style={{ overflow: "hidden" }}>{item.sn}</p>
     </div>)
     const cv = <div id="list">{listItem}</div>
      setContentView(cv)
    })
}

  async function subBidRes(txid) {
    var address = localStorage.getItem('address')
    fetch(process.env.REACT_APP_APIHOST+"/api/index/bid",
    {
      headers:{'Content-Type': 'application/json'},
      "body": JSON.stringify({
        "address": address,
        "id": record.id,
        "amount": bidAmount,
        "txid":txid
      }),
      "method": "POST",
    }).then(response => {
      return response.json()
    }).then((res)=>{
      getAuctions();
      messageApi.open({
        type: 'success',
        content: 'success',
      });
    })
  }

  async function bid(instance) {
    const signer = signerRef.current as SensiletSigner;
    console.log('singer',signer)
    if (instance && signer) {
      const { isAuthenticated, error } = await signer.requestAuth();
      console.log(isAuthenticated,error)
      if (!isAuthenticated) {
        throw new Error(error);
      }
      instance.bindTxBuilder('bid', Auction.bidTxBuilder)
      await instance.connect(signer);
      const userAddress = await signer.getDefaultAddress();
      console.log(toHex(userAddress))
      signer.getBalance(userAddress).then(balance => {
        console.log("balance:",balance)
        console.log(balance.confirmed , balance.unconfirmed)
      })
     const publicKey =await signer.getDefaultPubKey();
     const balance = instance.from.satoshis;
      // contract call `bid`
      const { tx: bidTx, next } = await instance.methods.bid(
          PubKey(toHex(publicKey)),
          BigInt(bidAmount),
          {
              changeAddress: publicKey.toAddress(),
          } as MethodCallOptions<Auction>
      )
      console.log('Bid Tx: ', bidTx.id)
      subBidRes(bidTx.id)
    }
  }

  async function minBidBalance(instance) {
    const balance = instance.from.satoshis;
    setBidMin(balance+1);
    setBidAmount(balance+1);
  }

  async function fetchContract(txid){
    setContractId(txid);
    try {
      const instance = await Scrypt.contractApi.getLatestInstance(
        Auction,{
          txId: txid,
          outputIndex: 0
      }
      );
      console.log(instance);
      setAuctionContract(instance);
      minBidBalance(instance);
    } catch (error: any) {
      console.error("fetchContract error: ", error);
    }

    const subscription = Scrypt.contractApi.subscribe(
      {
        clazz: Auction,
        id: {
            txId: txid,
            outputIndex: 0
          },
      },
      (event: ContractCalledEvent<Auction>) => {
        console.log(event)
        setAuctionContract(event.nexts[0]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }

  function changebid(event){
    setBidAmount(event);
  }

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = (item) => {
    setRecord(item);
    setIsModalOpen(true);
    if(item.status=="online"){
      setModalText("Bid");
      setInputDisplay("")
      fetchContract(item.txid);
    }else{
      setModalText("Ok");
      setInputDisplay("none");
    }
  };

  const handleOk = () => {
    setIsModalOpen(false);
    if(record.status=='online'){
      bid(auctionContract);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const [modalText,setModalText] = useState("Bid");
  return (
    <div>
        {contextHolder}
        {contentView}
        <Modal title={record.title} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} okText={modalText} style={{textAlign:'center'}}>
          <div>
            <div style={{display:'flex',  flexDirection:'row'}}>
              <img style={{width:'100px', flex: 2}} src={record.image}/>
              <div style={{flex:3, textAlign:'left',paddingLeft:'20px'}}>
                <p>sn:{record.sn}</p>
                <p style={{wordBreak:'break-all'}}>contractId:<a target="_blank" href={"https://test.whatsonchain.com/tx/"+record.txid}>{record.txid}</a></p>
                <p>bidAmount:{record.amount}</p>
                <p>deadline:{moment(record.deadline*1000).format("YYYY-MM-DD HH:mm:ss")}</p>
              </div>
            </div>
            <Space style={{display: inputDisplay}}>
              <span>bid amount:</span>
              <InputNumber title="bid amount:" size="large" min={bidMin} value={bidAmount} onChange={changebid}/>
            </Space>
          </div>
        </Modal>
    </div>
  );
}

export default MyBid;
