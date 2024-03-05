import { sendPasswordResetEmail } from "firebase/auth";
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

export default function FindPassword() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      target: { name, value },
    } = e;
    if (name === "email") {
      setEmail(value);
    }
  };

  const onSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    // 로딩 중이거나 이름, 이메일, 비밀번호 중 하나라도 비어있으면 함수 실행을 종료
    if (loading || email === "") return;
    try {
      // 로딩 상태를 true로 설정해 UI에 로딩 중임을 표시
      setLoading(true);

      await sendPasswordResetEmail(auth, email);
      alert("Success sending email!");
      navigate("/login");
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
      <Title>Find password 🐱‍🏍</Title>
      <Form onSubmit={onSubmit}>
        <Input
          onChange={onChange}
          name="email"
          value={email}
          placeholder="Email"
          type="email"
          required
        />
        <Input type="submit" value={loading ? "Loading..." : "Send Email"} />
      </Form>
      {error !== "" ? <Error>{error}</Error> : null}
      <Switcher>
        Don't have an account?
        <Link to="/create-account">Create one &rarr;</Link>
      </Switcher>
      <Switcher>
        Already have an account?<Link to="/login">Log in &rarr;</Link>
      </Switcher>
    </Wrapper>
  );
}
