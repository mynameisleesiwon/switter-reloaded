import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import React, { useState } from "react";

import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import {
  Error,
  Form,
  Input,
  Switcher,
  Title,
  Wrapper,
} from "../components/auth-components";
import GithubButton from "../components/github-btn";

export default function CreateAccount() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      target: { name, value },
    } = e;
    if (name === "name") {
      setName(value);
    } else if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }
  };

  const onSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    // 로딩 중이거나 이름, 이메일, 비밀번호 중 하나라도 비어있으면 함수 실행을 종료
    if (loading || name === "" || email === "" || password === "") return;
    try {
      // 로딩 상태를 true로 설정해 UI에 로딩 중임을 표시
      setLoading(true);

      // Firebase의 createUserWithEmailAndPassword 함수를 사용하여
      // 새로운 사용자 계정을 생성.
      // 이메일과 비밀번호는 사용자 입력 값을 사용
      const crednetials = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log(crednetials.user);

      // 생성된 사용자의 프로필을 업데이트
      await updateProfile(crednetials.user, {
        displayName: name,
      });

      // 모든 과정이 성공적으로 끝나면 사용자를 홈 페이지로 리다이렉트
      navigate("/");
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.log(error.code, error.message);
        setError(error.message);
      }
    } finally {
      // try 블록과 catch 블록을 실행한 후,
      // 마지막으로 로딩 상태를 false로 설정
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <Title>Join 🐱‍🏍</Title>
      <Form onSubmit={onSubmit}>
        <Input
          onChange={onChange}
          name="name"
          value={name}
          placeholder="Name"
          type="text"
          required
        />
        <Input
          onChange={onChange}
          name="email"
          value={email}
          placeholder="Email"
          type="email"
          required
        />
        <Input
          onChange={onChange}
          name="password"
          value={password}
          placeholder="Password"
          type="password"
          required
        />
        <Input
          type="submit"
          value={loading ? "Loading..." : "Create Account"}
        />
      </Form>
      {error !== "" ? <Error>{error}</Error> : null}
      <Switcher>
        Already have an account?<Link to="/login">Log in &rarr;</Link>
      </Switcher>
      <GithubButton />
    </Wrapper>
  );
}
