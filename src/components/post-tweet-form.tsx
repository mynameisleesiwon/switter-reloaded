import { addDoc, collection, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import styled from "styled-components";
import { auth, db, storage } from "../firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TextArea = styled.textarea`
  border: 2px solid black;
  padding: 20px;
  border-radius: 20px;
  font-size: 16px;
  color: black;
  background-color: white;
  width: 100%;
  resize: none;

  &::placeholder {
    font-size: 16px;
  }

  &:focus {
    outline: none;
    border-color: #1d9bf0;
  }
`;

const AttachFileButton = styled.label`
  padding: 10px 0px;
  color: #1d9bf0;
  text-align: center;
  border-radius: 20px;
  border: 1px solid #1d9bf0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const AttachFileInput = styled.input`
  display: none;
`;

const SubmitBtn = styled.input`
  background-color: #1d9bf0;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 0px;
  font-size: 16px;
  cursor: pointer;
  &:hover,
  &:active {
    opacity: 0.9;
  }
`;

export default function PostTweetForm() {
  const [isLoading, setLoading] = useState(false);
  const [tweet, setTweet] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTweet(e.target.value);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;

    // 파일이 존재하고, 단 하나의 파일만 선택되었을 경우에만 조건문 내부 로직을 실행
    if (files && files.length === 1) {
      // 선택된 파일의 크기를 메가바이트 단위로 변환
      const fileSizeInMB = files[0].size / 1024 / 1024;

      // 파일 크기가 1MB 미만인 경우에만 setFile을 호출하여 상태를 업데이트
      if (fileSizeInMB < 1) {
        setFile(files[0]);
      } else {
        alert("파일 크기는 1MB 미만이어야 합니다.");
        e.target.value = "";
      }
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // 새로고침 방지
    e.preventDefault();

    // 현재 로그인한 사용자의 정보
    const user = auth.currentUser;

    // 로그인한 사용자가 없거나, 로딩 중이거나, 트윗 내용이 비어 있거나, 트윗 길이가 180자를 초과하는 경우 함수를 종료
    if (!user || isLoading || tweet == "" || tweet.length > 180) return;

    try {
      setLoading(true); // 데이터 처리 전 로딩 상태로 변경

      // 파이어스토어의 'tweets' 컬렉션에 새 문서를 추가
      const doc = await addDoc(collection(db, "tweets"), {
        tweet, // 트윗 내용
        createdAt: Date.now(), // 현재 시간을 생성 시간으로 저장
        username: user.displayName || "Anonymous", // 사용자 이름이 없으면 'Anonymous'로 저장
        writerId: user.uid, // 사용자의 고유 ID를 저장
      });

      // 유저가 파일을 첨부 했는지 확인
      if (file) {
        // ref는 파이어베이스 스토리지에서 파일의 위치를 참조하기 위한 함수
        // 'storage'에서 정의된 경로에 파일을 저장
        // 경로는 'tweets/유저 아이디-유저 닉네임/문서 아이디' 형식
        // 이렇게 하면 파일이 사용자와 트윗에 구체적으로 연관되어 정리
        const locationRef = ref(storage, `tweets/${user.uid}/${doc.id}`);

        // 'uploadBytes' 함수를 이용해 생성된 참조 위치에 파일을 실제로 업로드
        const result = await uploadBytes(locationRef, file);

        // 업로드한 파일의 다운로드 URL을 가져옵니다.
        const url = await getDownloadURL(result.ref);

        // 'updateDoc' 함수를 사용하여 파이어스토어의 문서를 업데이트
        // 이때, 'photo' 필드를 앞서 얻은 파일의 URL로 설정
        await updateDoc(doc, {
          photo: url,
        });

        // 초기화
        setTweet("");
        setFile(null);
      }
    } catch (e) {
      console.log(e); // 에러가 발생하면 콘솔에 에러를 출력
    } finally {
      setLoading(false); // 데이터 처리가 끝나면 로딩 상태를 해제
    }
  };

  return (
    <Form onSubmit={onSubmit}>
      <TextArea
        required
        rows={5}
        maxLength={180}
        onChange={onChange}
        value={tweet}
        placeholder="What is happening?!"
      />
      <AttachFileButton htmlFor="file">
        {file ? "Photo added ✔" : "Add photo"}
      </AttachFileButton>
      <AttachFileInput
        onChange={onFileChange}
        type="file"
        id="file"
        accept="image/*"
      />
      <SubmitBtn
        type="submit"
        value={isLoading ? "Posting..." : "Post Tweet"}
      />
    </Form>
  );
}
