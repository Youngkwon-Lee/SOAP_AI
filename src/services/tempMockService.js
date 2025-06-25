// 임시 Mock 함수
const generateMockSoapNote = async (params) => {
  console.log(' Mock SOAP 노트 생성 시작');
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    patientInfo: params.patientInfo,
    subjective: '환자는 ' + params.shorthandNotes.slice(0, 50) + '... 등의 증상을 호소함',
    objective: '신체검사: ROM 제한, 근력 약화 관찰됨',
    assessment: params.noteType + ' 관련 기능장애 진단',
    plan: '6주간 집중 치료 프로그램 시행 예정'
  };
};

// 기존 함수 대체
export { generateMockSoapNote as generateSoapNote };
