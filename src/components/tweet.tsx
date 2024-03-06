import styled from "styled-components";
import { ITweet } from "./timeline";
import { auth, db, storage } from "../firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.5);
  border-radius: 15px;
`;

const Column = styled.div``;

const Photo = styled.img`
  width: 100px;
  height: 100px;
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

const DeleteButton = styled.button`
  background-color: tomato;
  color: white;
  font-weight: 500;
  border: 0;
  font-size: 12px;
  padding: 5px 10px;
  text-transform: uppercase;
  border-radius: 5px;
  cursor: pointer;
`;

export default function Tweet({ username, photo, tweet, userId, id }: ITweet) {
  const user = auth.currentUser;

  const onDelete = async () => {
    // confirm 함수는 확인을 누르면 true, 취소를 누르면 false를 반환
    const ok = confirm("Are you sure you want to delete this tweet?");

    // 사용자가 취소를 누르거나 현재 로그인한 사용자의 UID와 트윗을 작성한 사용자의 UID가 다르면 아무것도 하지 않고 함수를 종료
    if (!ok || user?.uid !== userId) return;

    try {
      // 파이어베이스의 deleteDoc 함수를 이용하여 해당 트윗 문서를 삭제
      await deleteDoc(doc(db, "tweets", id));

      // 트윗에 사진이 첨부되어 있다면 해당 사진도 스토리지에서 삭제
      if (photo) {
        // photoRef 변수를 통해 파이어베이스 스토리지 내의 사진 경로를 참조
        const photoRef = ref(storage, `tweets/${user.uid}/${id}`);
        // deleteObject 함수를 이용하여 해당 사진을 스토리지에서 삭제
        await deleteObject(photoRef);
      }
    } catch (e) {
      console.log(e);
    } finally {
    }
  };

  return (
    <Wrapper>
      <Column>
        <Username>{username}</Username>
        <Payload>{tweet}</Payload>
        {user?.uid === userId ? (
          <DeleteButton onClick={onDelete}>Delete</DeleteButton>
        ) : null}
      </Column>
      <Column>{photo ? <Photo src={photo} /> : null}</Column>
    </Wrapper>
  );
}
