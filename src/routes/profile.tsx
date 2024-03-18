import styled from "styled-components";
import { auth, db, storage } from "../firebase";
import React, { useEffect, useState } from "react";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { updateProfile } from "firebase/auth";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { ITweet } from "../components/timeline";
import Tweet from "../components/tweet";

interface UpdatedData {
  tweet: string;
  updatedAt: number;
  photo?: string | null; // `photo` 속성은 선택적(optional)
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 20px;
`;

const AvatarUpload = styled.label`
  width: 80px;
  overflow: hidden;
  height: 80px;
  border-radius: 50%;
  background-color: #1d9bf0;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: 50px;
  }
`;

const AvatarImg = styled.img`
  width: 100%;
`;

const AvatarInput = styled.input`
  display: none;
`;

const Name = styled.span`
  font-size: 22px;
`;

const Tweets = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

export default function Profile() {
  const user = auth.currentUser;
  const [avatar, setAvatar] = useState<any>(user?.photoURL);
  const [tweets, setTweets] = useState<ITweet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;

    if (!user) return;

    if (files && files.length === 1) {
      const file = files[0];
      // 저장할 경로 & 저장할 이름
      const locationRef = ref(storage, `avatars/${user?.uid}`);
      // 사진 업로드
      const result = await uploadBytes(locationRef, file);
      // URL 추출 & 변수에 저장
      const avatarUrl = await getDownloadURL(result.ref);
      setAvatar(avatarUrl);

      // 프로필 사진 변경
      await updateProfile(user, {
        photoURL: avatarUrl,
      });
    }
  };

  const onDeleteTweet = async (
    userId: string,
    writerId: string,
    id: string,
    photo?: string
  ) => {
    // confirm 함수는 확인을 누르면 true, 취소를 누르면 false를 반환
    const ok = confirm("Are you sure you want to delete this tweet?");

    // 사용자가 취소를 누르거나 현재 로그인한 사용자의 UID와 트윗을 작성한 사용자의 UID가 다르면 아무것도 하지 않고 함수를 종료
    if (!ok || userId !== writerId) return;

    try {
      // 파이어베이스의 deleteDoc 함수를 이용하여 해당 트윗 문서를 삭제
      await deleteDoc(doc(db, "tweets", id));

      // 트윗에 사진이 첨부되어 있다면 해당 사진도 스토리지에서 삭제
      if (photo) {
        // photoRef 변수를 통해 파이어베이스 스토리지 내의 사진 경로를 참조
        const photoRef = ref(storage, `tweets/${userId}/${id}`);
        // deleteObject 함수를 이용하여 해당 사진을 스토리지에서 삭제
        await deleteObject(photoRef);
      }
    } catch (e) {
      console.log(e);
    } finally {
    }
  };

  const onEditTweet = async (
    editedTweet: string,
    userId: string,
    writerId: string,
    id: string,
    type: string,
    photo?: string | null,
    editedPhoto?: string | null,
    file?: File | null
  ) => {
    if (type === "back") {
      setEditingId(null);
      return;
    }

    if (editingId === id) {
      const ok = confirm("Are you sure you want to edit this tweet?");

      if (!ok || userId !== writerId) return;

      try {
        // 파이어스토어의 문서 참조
        const tweetDocRef = doc(db, "tweets", id);

        // 업데이트할 문서 데이터 초기화 (UpdatedData 타입을 사용)
        const updatedData: Partial<UpdatedData> = {
          tweet: editedTweet,
          updatedAt: Date.now(),
        };

        // 사용자가 사진을 삭제하려는 경우

        if (editedPhoto === undefined) {
          // 기존 사진 URL이 있었다면 스토리지에서 해당 파일 삭제
          if (photo) {
            console.log(`tweets/${writerId}/${id}`);
            const fileRef = ref(storage, `tweets/${writerId}/${id}`);
            await deleteObject(fileRef);
          }
          // 문서 데이터에서 photo 프로퍼티 삭제
          await updateDoc(tweetDocRef, {
            photo: deleteField(),
          });
        }

        // 새 파일이 첨부된 경우
        if (file) {
          const locationRef = ref(storage, `tweets/${writerId}/${id}`);
          const result = await uploadBytes(locationRef, file);
          const photoURL = await getDownloadURL(result.ref);
          updatedData.photo = photoURL;
        }

        // 파이어스토어 문서 업데이트
        await updateDoc(tweetDocRef, updatedData);

        // 수정 상태 해제
        setEditingId(null);
      } catch (e) {
        console.log(e);
      }
    } else {
      setEditingId((prevId) => (prevId === id ? null : id));
    }
  };

  const fetchTweets = async () => {
    const tweetQuery = query(
      collection(db, "tweets"),
      where("writerId", "==", user?.uid),
      orderBy("createdAt", "desc"),
      limit(25)
    );

    const snapshot = await getDocs(tweetQuery);
    const tweets = snapshot.docs.map((doc) => {
      const { tweet, createdAt, writerId, username, photo } = doc.data();

      return {
        tweet,
        createdAt,
        writerId,
        username,
        photo,
        id: doc.id,
      };
    });
    setTweets(tweets);
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  return (
    <Wrapper>
      <AvatarUpload htmlFor="avatar">
        {Boolean(avatar) ? (
          <AvatarImg src={avatar} />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="white"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="white"
            className="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        )}
      </AvatarUpload>
      <AvatarInput
        onChange={onAvatarChange}
        id="avatar"
        type="file"
        accept="image/*"
      />
      <Name>{user?.displayName ?? "Anonymous"}</Name>
      <Tweets>
        {tweets.map((tweet) => (
          <Tweet
            key={tweet.id}
            {...tweet}
            editingId={editingId}
            userId={user?.uid}
            onDeleteTweet={onDeleteTweet}
            onEditTweet={onEditTweet}
          />
        ))}
      </Tweets>
    </Wrapper>
  );
}
