# question!!!
- DB에 connection한 후, connection을 끝내주지 않아도 되는건가?
- 분명 connection을 끝내주지 않으면 이 요청이 계속 쌓여 문제가 생겨난다고 배운 것 같음.
- 끝내주지 않아도 될까..?


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
- [ ] 회원가입 이메일 인증하기

## server.js
- [ ] XXS 막기
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
- [ ] sql injection 막기
- [X] sql 사용하기.. => https://reddb.tistory.com/143
- [ ] sql 적용하기
- [X] email 보내는거 테스트하기
- [ ] valid email code