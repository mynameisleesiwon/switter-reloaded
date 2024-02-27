import React from "react";
import { auth } from "../firebase";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  // 유저가 로그인 했는지 여부 확인
  const user = auth.currentUser;

  // 로그인 안했을 시
  if (user === null) {
    // 로그인 창으로 이동
    return <Navigate to="/login" />;
  }

  return children;
}
