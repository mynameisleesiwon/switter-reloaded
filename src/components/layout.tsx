{
  /* Outlet은 중첩된 라우트의 컴포넌트를 렌더링하는 플레이스홀더 역할 */
}
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <h2>layout</h2>
      {/* 현재 라우트에 연결된 자식 라우트 컴포넌트를 렌더링합니다. */}
      <Outlet />
    </>
  );
}
