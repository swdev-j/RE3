# question!!!
- DB에 connection한 후, connection을 끝내주지 않아도 되는건가?
- 분명 connection을 끝내주지 않으면 이 요청이 계속 쌓여 문제가 생겨난다고 배운 것 같음.
- 끝내주지 않아도 될까..?

# Problem
- [X] 1. socket.io에는 session이 없음. => 아무리 잘 해놓아봤자, 새로고침하면 초기화. 어떻게 할 것인가?
- [X] 2. db를 node 실행 초기 한번만 connection 함. => 계속된 연결이 있지 않는 한, 연결이 끊김. 어떻게 해결할까?
  => mysql에 마지막 요청을 기준으로 wait_timeout의 시간이 경과하면 PROTOCOL_CONNECTION_LOST 오류 발생하며 connection 잃음.


# Solution
 1. express-socket.io-session이란 모듈 찾음. 하지만, session을 초기에 지정해주어야 함.
``````
const session = require('express-session');
const session_data = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
});
``````
 2. mysql connection 대신 mysql pool을 쓰면 된다더라..?
  [related link](https://stackoverflow.com/questions/20210522/nodejs-mysql-error-connection-lost-the-server-closed-the-connection)

# todo
## index.html
- [X] index.html 디자인
- [X] index.html socket => send message code
- [X] index.html socket => receive message code
- [X] index.html socket => receive message 시, 나인지 상대방인지 구별
- [X] index.html socket => receive type code
- [X] 악성 값이 0이면 초록색 1이면 노란색 2 이상이면 빨간색
- [X] 이름 변경 막는 코드
- [X] 위로 스크롤 시, DB에서 추가 데이터 가져오기

## (etc).html
- [X] signin.html => 회원가입 페이지 완성하기
- [X] login.html => 로그인 페이지 완성하기
- [X] forget.html => 비밀번호 찾기 페이지 완성하기

## signin.html
- [X] 회원가입 닉네임 중복확인
- [X] 회원가입 이메일 중복확인
- [X] 회원가입 이메일 인증하기

## /signin post
- [X] sql 닉네임 중복확인
- [X] sql 이메일 중복확인
- [X] 이메일 인증코드 확인
- [X] pw 유효한지, 같은지 확인

## server.js
- [X] XXS 막기
- [X] server.js socket => send message code
- [X] server.js socket => receive message code
- [X] receive message => DB에 넣기
- [X] server.js socket => receive type code
- [X] receive type => DB에 넣기
- [X] server.js DB => login code
- [X] server.js => logout code
- [X] server.js DB => signin code
- [X] server.js DB => signin 시, valid nickname & valid email 확인.
- [X] server.js DB => forget code
- [X] 이름 변경 막는 코드
- [X] sql Object 완성하기
- [X] sql injection 막기
- [X] sql 사용하기.. => https://reddb.tistory.com/143
- [X] sql 적용하기
- [X] email 보내는거 테스트하기

## forget.html
 - nickname => email로 nickname 보내주기
 - password => 인증 완료 시, 비밀번호 변경 가능하게.

## 추가할 것.
 - [ ] 추가 채팅방
 - [ ] 이벤트(생일 이벤트, 복불복 등등)
 - [ ] 급식 등등 키워드 모달창