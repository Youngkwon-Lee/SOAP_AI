
export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "이메일 또는 비밀번호가 일치하지 않습니다.";
    case "auth/email-already-in-use":
      return "이미 사용 중인 이메일입니다.";
    case "auth/weak-password":
      return "비밀번호는 6자 이상이어야 합니다.";
    case "auth/invalid-email":
      return "유효하지 않은 이메일 형식입니다.";
    case "auth/network-request-failed":
      return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
    case "auth/popup-closed-by-user":
      return "소셜 로그인 팝업이 닫혔습니다. 다시 시도해주세요.";
    default:
      return "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};
