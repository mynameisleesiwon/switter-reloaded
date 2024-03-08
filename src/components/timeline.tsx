import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { auth, db, storage } from "../firebase";
import Tweet from "./tweet";
import { Unsubscribe } from "firebase/auth";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

// ITweet 인터페이스는 트윗 데이터의 타입을 정의
export interface ITweet {
  id: string;
  // photo? : 속성이 있어도 되고 없어도 됨
  photo?: string;
  tweet: string;
  writerId: string;
  username: string;
  createdAt: number;
}

export interface ITWeetForm extends ITweet {
  // 새로운 속성을 추가할 수 있습니다.
  editingId: string | null;
  userId?: string | null;
  onDeleteTweet: (
    userId: string,
    writerId: string,
    id: string,
    photo?: string
  ) => void;
  onEditTweet: (
    editedTweet: string,
    userId: string,
    writerId: string,
    id: string,
    type: string,
    photo?: string | null,
    editedPhoto?: string | null,
    file?: File | null
  ) => void;
}

interface UpdatedData {
  tweet: string;
  updatedAt: number;
  photo?: string | null; // `photo` 속성은 선택적(optional)
}

const Wrapper = styled.div`
  display: flex;
  gap: 10px;
  flex-direction: column;
`;

export default function Timeline() {
  const user = auth.currentUser;

  const [tweets, setTweets] = useState<ITweet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  useEffect(() => {
    // 구독을 해제할 수 있는 변수를 선언
    // Unsubscribe 타입은 파이어베이스에서 제공하는 타입으로, 구독 해제 함수의 타입
    let unsubscribe: Unsubscribe | null = null;

    // 트윗들을 가져오는 비동기 함수를 선언
    const fetchTweets = async () => {
      // 파이어베이스에서 제공하는 query 함수를 사용하여 트윗들을 가져오는 쿼리를 생성
      // 'tweets' 컬렉션에서 'createdAt' 필드를 기준으로 내림차순으로 정렬하고,
      // 최대 25개의 문서만 가져오도록 설정
      const tweetsQuery = query(
        collection(db, "tweets"),
        orderBy("createdAt", "desc"),
        limit(25)
      );

      // onSnapshot 함수를 사용하여 실시간으로 데이터베이스의 변경사항을 감지
      // tweetsQuery에 정의된 조건에 맞는 데이터가 변경될 때마다 콜백 함수가 호출
      unsubscribe = await onSnapshot(tweetsQuery, (snapshot) => {
        // snapshot.docs를 맵핑하여 각 문서(doc)의 데이터를 추출하고
        // 필요한 정보만을 객체로 구성하여 새로운 tweets 배열을 만듬
        const tweets = snapshot.docs.map((doc) => {
          const { tweet, createdAt, writerId, username, photo } = doc.data();

          return {
            tweet,
            createdAt,
            writerId,
            username,
            photo,
            id: doc.id, // 문서의 고유 ID도 객체에 포함
          };
        });

        // 추출한 트윗 데이터로 상태를 업데이트
        setTweets(tweets);
      });
    };

    // 트윗들을 가져오는 함수를 실행
    fetchTweets();

    // 컴포넌트가 언마운트될 때 실행
    // 구독을 해제하는 함수가 존재한다면,
    // 구독을 해제하여 불필요한 리소스 사용을 방지
    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  return (
    <Wrapper>
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
    </Wrapper>
  );
}
