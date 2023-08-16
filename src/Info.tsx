import React, { useEffect, useRef, useState } from "react";
import logo from './logo.svg';
import './Info.css';
import scriptpng from '../public/sCrypt.png'
import auctionpng from '../public/auction.png'
import { Button ,MenuProps, Menu,  Avatar, Space, Popover, Input} from 'antd';
import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import { UserOutlined } from '@ant-design/icons';

import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';

function Info(props: any) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [nickname, setNickname] = useState("");

  const [messageApi, contextHolder] = message.useMessage();

  const getBase64 = (img: RcFile, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result as string));
    reader.readAsDataURL(img);
  };
  
  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 10;
    if (!isLt2M) {
      message.error('Image must smaller than 10MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  const handleChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj as RcFile, (url) => {
        setLoading(false);
        setImageUrl(url);
      });
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  useEffect(() => {
    getInfo()
    
  }, []);
  
  async function getInfo() {
    var address = localStorage.getItem('address')
    fetch(process.env.REACT_APP_APIHOST+"/api/index/info",
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
      setImageUrl(data.image)
      setNickname(data.nickname)
    })
}

  async function updateInfo(e: any) {
      var address = localStorage.getItem('address')
      fetch(process.env.REACT_APP_APIHOST+"/api/index/updateinfo",
      {
        headers:{'Content-Type': 'application/json'},
        "body": JSON.stringify({
          "address": address,
          "image": imageUrl,
          "nickname": nickname
        }),
        "method": "POST",
      }).then(response => {
        return response.json()
      }).then((data)=>{
          messageApi.open({
            type: 'success',
            content: 'success',
          });
          getInfo()
          props.appfun();
      })
  }

  const changeNickname =(event)=>{
    setNickname(event.target.value)
  }

  return (
    <div style={{padding: '30px'}}>
      {contextHolder}
      <Upload
        name="avatar"
        listType="picture-circle"
        className="avatar-uploader"
        showUploadList={false}
        action="http://localhost/index.php/api/index/upload"
        beforeUpload={beforeUpload}
        onChange={handleChange}
      >
        {imageUrl ? <img id="avatarimg"  src={imageUrl} alt="avatar" style={{ width: '100%'}} /> : uploadButton}
      </Upload>

      <div style={{ textAlign: 'center', marginTop: '16px'}}>
      <Input onChange={changeNickname} value={nickname} style={{ width: '50%' }} size="large" placeholder="nickname" prefix={<UserOutlined />} />
      <br></br>
      <Button onClick={updateInfo} style={{ marginTop: '16px', width: '50%' }}>Save</Button>
      </div>
      
    </div>
  );
}

export default Info;
