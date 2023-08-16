import React, { useEffect, useRef, useState } from "react";
import logo from './logo.svg';
import './CreateAuction.css';
import { Button ,MenuProps, Menu,  Avatar, Space, Popover, Input} from 'antd';
import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import { UserOutlined } from '@ant-design/icons';

import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { bsv, TestWallet, DefaultProvider } from 'scrypt-ts'
import { findSig, MethodCallOptions, PubKey, toHex } from 'scrypt-ts'
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';

function CreateAuction(props: any) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
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
    
    
  }, []);


  async function createauction() {
    var address = localStorage.getItem('address')
      fetch(process.env.REACT_APP_APIHOST+"/api/index/createauction",
      {
        headers:{'Content-Type': 'application/json'},
        "body": JSON.stringify({
          "address": address,
          "image": imageUrl,
          "deadline": deadline,
          'title': title
        }),
        "method": "POST",
      }).then((data)=>{
        messageApi.open({
          type: 'success',
          content: 'success',
        });
        props.appfun();
      })
  }

  const changeTitle =(event)=>{
    setTitle(event.target.value)
  }

  function changeDeadline(date, dateString) {
    setDeadline(dateString)
  }

  const range = (start: number, end: number) => {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i as never);
    }
    return result;
  };

  // eslint-disable-next-line arrow-body-style
  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    // Can not select days before today and today
    return current && current < dayjs().endOf('day');
  };

  const disabledDateTime = () => ({
    disabledHours: () => range(0, 24).splice(4, 20),
    disabledMinutes: () => range(30, 60),
    disabledSeconds: () => [55, 56],
  });
  
  return (
    <div style={{padding: '30px'}}>
      {contextHolder}
      <Upload
        name="avatar"
        listType="picture-card"
        className="avatar-uploader"
        showUploadList={false}
        action="http://localhost/index.php/api/index/upload"
        beforeUpload={beforeUpload}
        onChange={handleChange}
      >
        {imageUrl ? <img src={imageUrl} alt="avatar" style={{ width: '100%'}} /> : uploadButton}
      </Upload>

      <div style={{ textAlign: 'center', marginTop: '16px'}}>
      <Input onChange={changeTitle} value={title} style={{ width: '50%' }} size="large" placeholder="title" prefix={<UserOutlined />} />
      <br></br>
      <DatePicker
      format="YYYY-MM-DD HH:mm:ss"
      disabledDate={disabledDate}
      disabledTime={disabledDateTime}
      showTime={{ defaultValue: dayjs('00:00:00', 'HH:mm:ss') }}
      placeholder="deadline"
      className="deadline"
      onChange={changeDeadline}
      />
      <br></br>
      <Button onClick={createauction} style={{ marginTop: '16px', width: '50%' }}>Save</Button>
      </div>
      
    </div>
  );
}

export default CreateAuction;
