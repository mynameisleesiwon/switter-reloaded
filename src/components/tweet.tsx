import styled from "styled-components";
import { ITWeetForm } from "./timeline";
import { auth, db, storage } from "../firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useEffect, useState } from "react";

const Wrapper = styled.div`
  display: grid;

  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.5);
  border-radius: 15px;
`;

const Column = styled.div`
  &.photoColumn {
    border: 1px solid rgb(163, 163, 163);
    border-radius: 20px;
    margin-bottom: 10px;
    position: relative;
  }
`;

const CloseDiv = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  margin-top: 10px;
  margin-right: 15px;
  width: 30px;
  height: 30px;
  background-color: rgba(15, 20, 25, 0.75);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:hover,
  &:active {
    opacity: 0.9;
  }
`;

const CloseSpan = styled.span`
  color: white;
`;

const Photo = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 15px;
`;

const Username = styled.span`
  font-weight: 600;
  font-size: 15px;
`;

const Payload = styled.p`
  margin: 10px 0px;
  font-size: 18px;
`;

const Button = styled.button`
  &.deleteBtn {
    background-color: tomato;
  }

  &.editBtn {
    background-color: #7c7c7c;
  }

  &.backBtn {
    background-color: #1d9bf0;
  }

  margin-right: 5px;
  color: white;
  font-weight: 500;
  border: 0;
  font-size: 12px;
  padding: 5px 10px;
  text-transform: uppercase;
  border-radius: 5px;
  cursor: pointer;
`;

const TextArea = styled.textarea`
  margin: 10px 0px;
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
  margin-bottom: 10px;
`;

const AttachFileInput = styled.input`
  display: none;
`;

export default function Tweet({
  editingId,
  userId,
  username,
  photo,
  tweet,
  writerId,
  id,
  onDeleteTweet,
  onEditTweet,
}: ITWeetForm) {
  const [editedTweet, setEditedTweet] = useState(tweet);
  const [editedPhoto, setEditedPhoto] = useState<string | undefined>(photo);
  const [file, setFile] = useState<File | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedTweet(e.target.value);
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

  const onEditPhoto = () => {
    setEditedPhoto(undefined);
  };

  useEffect(() => {
    if (editingId !== id) {
      setEditedTweet(tweet);
      setEditedPhoto(photo);
      setFile(null);
    }
  }, [editingId]);

  useEffect(() => {
    setEditedTweet(tweet);
    setEditedPhoto(photo);
    setFile(null);
  }, [tweet, photo]);

  return (
    <Wrapper>
      <Column>
        <Username>{username}</Username>
        {editingId === id ? (
          <TextArea
            required
            rows={5}
            maxLength={180}
            onChange={onChange}
            value={editedTweet}
            placeholder="What is happening?!"
          />
        ) : (
          <Payload>{tweet}</Payload>
        )}
      </Column>
      {photo && editingId !== id ? (
        <Column className="photoColumn">
          <Photo src={photo} />
        </Column>
      ) : null}
      {editingId === id && (
        <>
          {!editedPhoto ? (
            <>
              <AttachFileButton htmlFor="editPhoto">
                {file ? "Photo added ✔" : "Add photo"}
              </AttachFileButton>
              <AttachFileInput
                onChange={onFileChange}
                type="file"
                id="editPhoto"
                accept="image/*"
              />
            </>
          ) : (
            <Column className="photoColumn">
              <CloseDiv onClick={onEditPhoto}>
                <CloseSpan>X</CloseSpan>
              </CloseDiv>
              <Photo src={editedPhoto} />
            </Column>
          )}
        </>
      )}
      <Column>
        {userId === writerId ? (
          <>
            <Button
              className="deleteBtn"
              onClick={() => {
                onDeleteTweet(userId, writerId, id, photo);
              }}
            >
              Delete
            </Button>
            <Button
              className="editBtn"
              onClick={() => {
                onEditTweet(
                  editedTweet,
                  userId,
                  writerId,
                  id,
                  "edit",
                  photo,
                  editedPhoto,
                  file
                );
              }}
            >
              Edit
            </Button>
            {editingId === id ? (
              <Button
                className="backBtn"
                onClick={() => {
                  onEditTweet(
                    editedTweet,
                    userId,
                    writerId,
                    id,
                    "back",
                    photo,
                    editedPhoto,
                    file
                  );
                }}
              >
                Back
              </Button>
            ) : null}
          </>
        ) : null}
      </Column>
    </Wrapper>
  );
}
