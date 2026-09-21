# Agricola Multiplayer

Node.js, Express, Socket.IO 기반의 Agricola 실시간 멀티플레이 프로젝트입니다. 서버는 현재 폴더의 프론트엔드 파일도 정적으로 제공합니다.

## 프로젝트 구조

```text
agricola/
|-- assets/
|-- app.js
|-- index.html
|-- styles.css
|-- server.js          # Express + Socket.IO 서버
|-- server.mjs         # 기존 HTTP/SSE 서버(호환 보관)
|-- package.json
`-- README.md
```

## 실행

```powershell
cd C:\Users\Medimind\Desktop\agricola
npm install
npm start
```

브라우저에서 `http://localhost:5177`을 엽니다. 포트는 `PORT` 환경 변수로 변경할 수 있습니다.

프론트엔드와 백엔드를 서로 다른 주소에 배포한다면 `config.js`에 백엔드 주소를 지정합니다.

```js
window.AGRICOLA_SERVER_URL = "https://your-agricola-server.onrender.com";
```

같은 Express 서버에서 화면까지 제공할 때는 빈 문자열을 유지하면 됩니다. Socket.IO 연결은 동일 출처를 자동으로 사용합니다.

## Socket.IO 이벤트

### `create-room`

```js
socket.emit("create-room", { playerName: "농부 1", initialState: {} }, (result) => {
  console.log(result.room.code);
});
```

### `join-room`

```js
socket.emit("join-room", { roomCode: "A1B2C3", playerName: "농부 2" }, (result) => {
  console.log(result.room, result.state);
});
```

### `game-state`

방장만 상태를 갱신할 수 있습니다. 다른 참가자는 `game-state` 이벤트로 새 상태를 받습니다.

```js
socket.emit("game-state", { roomCode: "A1B2C3", state: gameState }, console.log);
socket.on("game-state", ({ state }) => renderGame(state));
```

참가자 목록은 `room-updated`, 방장 승계는 `host-changed` 이벤트로 전달됩니다. 방장이 나가면 입장 시간이 가장 빠른 참가자가 새 방장이 됩니다.

> 방과 게임 상태는 서버 메모리에 저장되므로 서버 재시작 시 초기화됩니다. 운영 환경에서는 Redis나 데이터베이스를 연결해야 합니다.
