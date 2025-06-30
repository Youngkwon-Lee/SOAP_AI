
export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, message: "비밀번호는 영문자를 포함해야 합니다." };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, message: "비밀번호는 숫자를 포함해야 합니다." };
  }
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
    return { isValid: false, message: "비밀번호는 특수문자를 포함해야 합니다." };
  }
  return { isValid: true, message: "" };
};
