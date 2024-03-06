import { useEffect, useState } from "react";
import styled from "styled-components";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import Tweet from "./tweet";

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

const Wrapper = styled.div``;

export default function Timeline() {
  const [tweets, setTweets] = useState<ITweet[]>([]);

  // 트윗들을 가져오는 비동기 함수
  const fetchTweets = async () => {
    // 파이어베이스 쿼리를 생성
    // 'tweets' 컬렉션에서 'createdAt' 필드에 따라 내림차순으로 정렬
    const tweetsQuery = query(
      collection(db, "tweets"),
      orderBy("createdAt", "desc")
    );

    // 위에서 정의한 쿼리를 사용하여 문서들을 가져옴
    const snapshot = await getDocs(tweetsQuery);

    // 가져온 문서들(snapshot.docs)을 순회하며,
    // 필요한 데이터를 추출하여 새로운 배열을 생성
    const tweets = snapshot.docs.map((doc) => {
      const { tweet, createdAt, userId, username, photo } = doc.data();

      // 각 트윗의 데이터와 문서 ID를 반환
      return {
        tweet,
        createdAt,
        userId,
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
      {tweets.map((tweet) => (
        <Tweet key={tweet.id} {...tweet} />
      ))}
    </Wrapper>
  );
}
