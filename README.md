# volca seq editor

KORG **volca keys** / **volca bass** 向けシーケンスエディタ（Vue 3 Composition API + Vuetify 4）。

[volcafm2-tools](https://github.com/mosynthkey/volcafm2-tools) のピアノロール / モーション / ユーティリティ思想を移植しつつ、**MIDI Out も SysEx もない**両機種向けに転送方式を差し替えています。

## SysEx 調査結果

公式 MIDI Implementation Chart（2013.06.10）より:

| | volca keys | volca bass |
|---|---|---|
| System Exclusive | なし | なし |
| MIDI Out | なし | なし |
| Note / Clock / CC | 受信可 | 受信可 |

そのため fm2 のようなシーケンスダンプ送受信はできません。転送は **REAL TIME REC** 前提で:

1. 本体で **REC** を押す
2. アプリの **転送** で `MIDI Start` + `Clock` + `Note On/Off`（必要なら `CC`）を送る
3. 1 周（または指定周回）後に `Stop`

## 主な機能

- 機種ドロップダウン（keys / bass）で CC マップと UI を切替
- ピアノロール（Step On / Active Step、ドラッグ移動・リサイズ、ユークリッド複製）
- **Keys Flux**: ステップ内 tick（96 clocks/pattern）の細かいタイミング編集
- **Bass**: VCO1–3 レーン編集（※ MIDI Note ではオシレーター個別指定不可。転送は選択レーンの Note + VCO Pitch CC）
- モーションを CC として REAL TIME REC に同時送信（Smooth 時はステップ内 5 点）
- SMF / JSON 入出力、ローカルライブラリ、ユークリッド、モーションパターン

## テーマ

機種ドロップダウンで UI カラーが切り替わります。

- **volca keys**: ゴールドフェイスプレート基調
- **volca bass**: シルバーフェイスプレート + 赤 LED 基調

## 開発

```bash
npm install
npm run dev
npm run verify
npm run build
```

Web MIDI 対応ブラウザ（Chrome / Edge 推奨）で MIDI インターフェースを接続してください。

## GitHub Pages

`main` への push で `.github/workflows/deploy-web.yml` がビルドし、GitHub Pages にデプロイします。

`https://mosynthkey.github.io/volca-seq-editor/`

## ライセンス

MIT。MIDI 仕様は KORG 公式実装チャートに基づく。
