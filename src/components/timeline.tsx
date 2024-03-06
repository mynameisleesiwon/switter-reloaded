import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import Tweet from "./tweet";
import { Unsubscribe } from "firebase/auth";

// ITweet 인터페이스는 트윗 데이터의 타입을 정의
export interface ITweet {
  id: string;
  // photo? : 속성이 있어도 되고 없어도 됨
  photo?: string;
  tweet: string;
  userId: string;
  username: string;
  createdAt: number;
}

const Wrapper = styled.div`
  display: flex;
  gap: 10px;
  flex-direction: column;
`;

export default function Timeline() {
  const [tweets, setTweets] = useState<ITweet[]>([]);

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
          const { tweet, createdAt, userId, username, photo } = doc.data();

          return {
            tweet,
            createdAt,
            userId,
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
        <Tweet key={tweet.id} {...tweet} />
      ))}
    </Wrapper>
  );
}
