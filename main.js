document.addEventListener('DOMContentLoaded', function() {
    var acc = document.getElementsByClassName("accordion-button");
    for (var i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
          panel.style.maxHeight = null;
        } else {
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    }
  });


// ==================== 
// import module
// ====================
const localFileSystem = require("uxp").storage.localFileSystem;
const core = require("photoshop").core;
const app = require("photoshop").app;

// ====================
// ExecuteのDialogの作成
// ====================
  const execute_dialog_html = `
  <dialog id="execute_dialog">
    <h2 id="execute_dialog_message">Sample Message.</h2>
    <footer>
      <button id="execute_dialog_ok_button">OK</button>
      <button id="execute_dialog_cancel_button">Cancel</button>
    </footer>
  </dialog>`;
  document.body.insertAdjacentHTML("beforeend", execute_dialog_html);

  const execute_dialog = document.getElementById("execute_dialog");
  const execute_dialog_ok_button = document.getElementById("execute_dialog_ok_button");
  const execute_dialog_cancel_button = document.getElementById("execute_dialog_cancel_button");

  async function show_exec_dialog(message) {
    document.getElementById("execute_dialog_message").innerText = message;
    return new Promise((resolve) => {
      // OKボタンのイベントハンドラ
      execute_dialog_ok_button.onclick = () => {
        execute_dialog.close("ok"); // ダイアログを閉じ、"ok"を引数にしてcloseメソッドを呼び出す
      };
      // Cancelボタンのイベントハンドラ
      execute_dialog_cancel_button.onclick = () => {
        execute_dialog.close("cancel"); // ダイアログを閉じ、"cancel"を引数にしてcloseメソッドを呼び出す
      };
      // ダイアログが閉じられたときの処理
      execute_dialog.onclose = () => {
        if (execute_dialog.returnValue === "ok") {
          resolve(true); // OKが押されたときはtrueを返す
        } else {
          resolve(false); // それ以外の場合はfalseを返す
        }
      };
      // ダイアログを表示
      execute_dialog.showModal();
    });
  }

// ====================
// OKのDialogの作成
// ====================
  const ok_dialog_html = `
  <dialog id="ok_dialog">
    <h2 id="ok_dialog_message">Sample Message.</h2>
    <footer><button id="ok_dialog_button">OK</button></footer>
    <h2 id="ok_dialog_detail">Detail.</h2>
  </dialog>`;
  document.body.insertAdjacentHTML("beforeend", ok_dialog_html);
  const ok_dialog = document.getElementById("ok_dialog");
  const ok_dialog_button = document.getElementById("ok_dialog_button");

  async function show_ok_dialog(message, detail='') {
    document.getElementById("ok_dialog_message").innerText = message;
    document.getElementById("ok_dialog_detail").innerHTML = detail;
    return new Promise((resolve) => {
      // OKボタンのイベントハンドラ
      ok_dialog_button.onclick = () => {
        ok_dialog.close("ok"); // ダイアログを閉じ、"ok"を引数にしてcloseメソッドを呼び出す
      };
      ok_dialog.onclose = () => {resolve(true);};
      // ダイアログを表示
      ok_dialog.showModal();
    });
  }


// ====================
// Input Dialogの作成
// ====================
  const input_dialog_html = `
  <dialog id="input_dialog">
    <label for="userInput">ユーザー入力:</label>
    <input type="text" id="userInput" name="userInput"/>
    <footer>
      <button id="input_dialog_ok_button">OK</button>
      <button id="input_dialog_cancel_button">Cancel</button>
    </footer>
  </dialog>`;
  document.body.insertAdjacentHTML("beforeend", input_dialog_html);
  const input_dialog = document.getElementById("input_dialog");
  const input_dialog_ok_button = document.getElementById("input_dialog_ok_button");
  const input_dialog_cancel_button = document.getElementById("input_dialog_cancel_button");

  async function show_input_dialog(path) {
    document.getElementById("userInput").value = path
    return new Promise((resolve) => {
      // OKボタンのイベントハンドラ
      input_dialog_ok_button.onclick = () => {
        input_dialog.close("ok"); // ダイアログを閉じ、"ok"を引数にしてcloseメソッドを呼び出す
      };
      // Cancelボタンのイベントハンドラ
      input_dialog_cancel_button.onclick = () => {
        input_dialog.close("cancel"); // ダイアログを閉じ、"cancel"を引数にしてcloseメソッドを呼び出す
      };
      // ダイアログが閉じられたときの処理
      input_dialog.onclose = () => {
        if (input_dialog.returnValue === "ok") {
          const userInput = document.getElementById("userInput").value;
          resolve(userInput); // OKが押されたときはtrueを返す
        } else {
          resolve(false); // それ以外の場合はfalseを返す
        }
      };
      // ダイアログを表示
      input_dialog.showModal();
    });
  }
 

// ====================
// レイヤーを表示する
// ====================
async function set_layer_visibility(layers, vis_flag){
  for (var i = 0, j = layers.length; i < j; i++){
    await core.executeAsModal(async () => {
        layers[i].visible = vis_flag;
    }, {"commandName": "レイヤーの表示を最初の状態に戻す"});
  }
}

// ====================
// ファイルをExportする関数
// ====================
async function export_png_file_path(file_entry) {
  await core.executeAsModal(async () => {
    const activeDocument = app.activeDocument;
    activeDocument.saveAs.png(file_entry);
  },{ commandName: `Export Layer As PNG start` });
}

// ====================
// 選択しているLayerを画像として出力する
// ====================
async function layer_to_file(vis_only){
  // var result = await show_exec_dialog('Textureの出力を行いますか？');
  // if (result == false){return}

  const root_folder = await localFileSystem.getFolder();
  if (root_folder == null){
    await show_ok_dialog('キャンセルされました。');
    return;
  }

  // ------------------
  // Layerの情報を登録
  // ------------------
  var start_vis_list = []; // 最初の表示の状態を保存
  var selected_layer = []; // 選択しているレイヤーを取得
  for (var i = 0, j = app.activeDocument.layers.length; i < j; i++){
    start_vis_list.push(app.activeDocument.layers[i].visible)
    if(app.activeDocument.layers[i].selected){
      selected_layer.push(app.activeDocument.layers[i]);
    }
  }
  // ------------------
  // flagによってすべてのLayerを非表示にするか、選択されているものだけを非表示にするか
  // ------------------
  if(vis_only == true){
    await set_layer_visibility(app.activeDocument.layers, false);
  }
  else{
    await set_layer_visibility(selected_layer, false);
  }
  
  for (var i = 0, j = selected_layer.length; i < j; i++){
    await set_layer_visibility([selected_layer[i]], true);
    var file_name = selected_layer[i].name + '.png';
    var file_entry = await root_folder.createFile(file_name, { overwrite: true });
    await export_png_file_path(file_entry);
    await set_layer_visibility([selected_layer[i]], false);
    console.log('Export Layer: ' + file_name);
  }

  // 表示の状態を最初の状態に戻す
  for (var i = 0, j = app.activeDocument.layers.length; i < j; i++){
    await core.executeAsModal(async () => {
      app.activeDocument.layers[i].visible = start_vis_list[i];
    }, {"commandName": "レイヤーの表示を最初の状態に戻す"});
  }

  await show_ok_dialog('完了しました');
}


// ====================
// ボタンを押したときの処理
// ====================
function cliecked_export_texture_button1() {
  layer_to_file(0);
}


function cliecked_export_texture_button2() {
  layer_to_file(1);
}


document.getElementById("export_texture_button1").addEventListener("click", cliecked_export_texture_button1);
document.getElementById("export_texture_button2").addEventListener("click", cliecked_export_texture_button2);
