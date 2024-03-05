import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout";
import Home from "./routes/home";
import Profile from "./routes/profile";
import Login from "./routes/login";
import CreateAccount from "./routes/create-account";
import styled, { createGlobalStyle } from "styled-components";
import reset from "styled-reset";
import { useEffect, useState } from "react";
import LoadingScreen from "./components/loading-screen";
import { auth } from "./firebase";
import ProtectedRoute from "./components/protected-route";
import FindPassword from "./routes/find-password";

// 브라우저 라우터 생성
// 어플리케이션의 라우트 구조 정의
const router = createBrowserRouter([
  {
    path: "/", // 루트 경로
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ), // 루트 경로에 대한 레이아웃 컴포넌트 지정
    children: [
      // 루트 경로의 자식 라우트들 정의
      {
        path: "",
        element: <Home />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/create-account",
    element: <CreateAccount />,
  },
  {
    path: "/find-password",
    element: <FindPassword />,
  },
]);

// 전역 스타일 정의
const GlobalStyles = createGlobalStyle`
${reset}; // 모든 브라우저에 대한 스타일 초기화
*{
  box-sizing: border-box;
}
body {
  background-color:white;
  color:black; 
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
`;

const Wrapper = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
`;

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const init = async () => {
    // wait for firebase
    // 인증 상태 준비되었는지 확인
    await auth.authStateReady();
    setIsLoading(false);
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <Wrapper>
      <GlobalStyles />
      {isLoading ? <LoadingScreen /> : <RouterProvider router={router} />}
    </Wrapper>
  );
}

export default App;
