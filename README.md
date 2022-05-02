# question!!!
- DB에 connection한 후, connection을 끝내주지 않아도 되는건가?
- 분명 connection을 끝내주지 않으면 이 요청이 계속 쌓여 문제가 생겨난다고 배운 것 같음.
- 끝내주지 않아도 될까..?

# Problem
- [X] 1. socket.io에는 session이 없음. => 아무리 잘 해놓아봤자, 새로고침하면 초기화. 어떻게 할 것인가?
- [ ] 2. db를 node 실행 초기 한번만 connection 함. => 계속된 연결이 있지 않는 한, 연결이 끊김. 어떻게 해결할까? 


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
like this.


# todo
## index.html
- [ ] index.html 디자인
- [X] index.html socket => send message code
- [X] index.html socket => receive message code
- [X] index.html socket => receive message 시, 나인지 상대방인지 구별
- [X] index.html socket => receive type code
- [ ] 악성 값이 0이면 초록색 1이면 노란색 2 이상이면 빨간색
- [X] 이름 변경 막는 코드


## (etc).html
- [ ] signin.html => 회원가입 페이지 완성하기
- [ ] login.html => 로그인 페이지 완성하기
- [ ] forget.html => 비밀번호 찾기 페이지 완성하기

## signin.html
- [ ] 회원가입 닉네임 중복확인
- [ ] 회원가입 이메일 중복확인
- [X] 회원가입 이메일 인증하기

## server.js
- [X] XXS 막기
- [X] server.js socket => send message code
- [ ] server.js socket => receive message code
- [ ] receive message => DB에 넣기
- [ ] server.js socket => receive type code
- [ ] receive type => DB에 넣기
- [ ] server.js DB => login code
- [ ] server.js DB => logout code
- [ ] server.js DB => signin code
- [ ] server.js DB => signin 시, valid nickname & valid email 확인.
- [ ] server.js DB => forget code
- [X] 이름 변경 막는 코드
- [X] sql Object 완성하기
- [X] sql injection 막기
- [X] sql 사용하기.. => https://reddb.tistory.com/143
- [ ] sql 적용하기
- [X] email 보내는거 테스트하기

