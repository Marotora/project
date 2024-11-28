// ===== ページの読み込み後に実行 =====
document.addEventListener("DOMContentLoaded", function() {
    // 各種要素を取得
    const registerForm = document.getElementById("registerForm"); // URL登録用フォーム
    const deleteForm = document.getElementById("deleteForm"); // URL削除用フォーム
    const urlInput = document.getElementById("urlInput"); // URL入力欄
    const urlList = document.getElementById("urlList"); // URL一覧表示エリア
    const topUrlList = document.getElementById("topUrlList"); // 上位アクセスURL表示エリア
    const recentUrlList = document.getElementById("recentUrlList"); // 最近登録されたURL表示エリア

    // ページ読み込み時にURL一覧を取得して表示
    fetchUrlList();

    // ===== URL登録の処理 =====
    registerForm.addEventListener("submit", function(e) {
        e.preventDefault(); // フォーム送信時のページリロードを防ぐ
        const url = urlInput.value.trim(); // 入力されたURLを取得し、余計な空白を除去
        if (url) {
            registerUrl(url); // 入力されたURLを登録
        }
    });

    // ===== URL削除の処理 =====
    deleteForm.addEventListener("submit", function(e) {
        e.preventDefault(); // フォーム送信時のページリロードを防ぐ
        // チェックボックスで選択されたURLを配列として取得
        const checkedUrls = Array.from(document.querySelectorAll("input[name='urlsToDelete']:checked"))
                                 .map(input => input.value);
        if (checkedUrls.length > 0) {
            deleteUrls(checkedUrls); // 選択されたURLを削除
        }
    });

    // ===== URL登録処理をサーバーに送信 =====
    function registerUrl(url) {
        const formData = new FormData(); // フォームデータを作成
        formData.append("action", "register"); // 動作タイプを指定（登録）
        formData.append("url", url); // URLデータを追加

        // サーバーにPOSTリクエストを送信
        fetch("server.php", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            urlInput.value = ""; // 入力欄をクリア
            updateUrlList(data.urls); // URL一覧を更新
            updateTopUrls(data.topUrls); // 上位URLを更新
            updateRecentUrls(data.recentUrls); // 最近登録されたURLを更新

            // 重複していた場合、そのURLを強調表示
            if (data.duplicateIndex !== null) {
                highlightDuplicateUrl(data.duplicateIndex);
            }
        });
    }

    // ===== URL削除処理をサーバーに送信 =====
    function deleteUrls(urlsToDelete) {
        const formData = new FormData(); // フォームデータを作成
        formData.append("action", "delete"); // 動作タイプを指定（削除）
        urlsToDelete.forEach(url => formData.append("urlsToDelete[]", url)); // 削除対象のURLを追加

        // サーバーにPOSTリクエストを送信
        fetch("server.php", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            updateUrlList(data.urls); // URL一覧を更新
            updateTopUrls(data.topUrls); // 上位URLを更新
            updateRecentUrls(data.recentUrls); // 最近登録されたURLを更新
        });
    }

    // ===== URLアクセス回数の更新処理をサーバーに送信 =====
    function incrementAccessCount(url) {
        const formData = new FormData(); // フォームデータを作成
        formData.append("action", "increment"); // 動作タイプを指定（アクセス回数の更新）
        formData.append("url", url); // 更新対象のURLを追加

        // サーバーにPOSTリクエストを送信
        fetch("server.php", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            updateTopUrls(data.topUrls); // 上位URLの表示を更新
        });
    }

    // ===== URL一覧をサーバーから取得して表示を更新 =====
    function fetchUrlList() {
        fetch("server.php?action=fetch") // サーバーにGETリクエストを送信
            .then(response => response.json())
            .then(data => {
                console.log(data);
                updateUrlList(data.urls); // URL一覧を更新
                updateTopUrls(data.topUrls); // 上位URLを更新
                updateRecentUrls(data.recentUrls); // 最近登録されたURLを更新
            })
            .catch(error => console.error("Error fetching URL list:", error)); // エラー時のログ
    }

    // ===== URL一覧を表示エリアに更新 =====
    function updateUrlList(urls) {
        // オブジェクトを配列に変換
    const urlArray = Array.isArray(urls) ? urls : Object.values(urls);
    
        urlList.innerHTML = ""; // 現在のリストをクリア
        urls.forEach((urlData, index) => {
            const urlItem = document.createElement("div"); // URL項目を作成
            urlItem.classList.add("url-item"); // クラスを付与
            urlItem.dataset.index = index; // インデックスをデータ属性に追加

            const checkbox = document.createElement("input"); // チェックボックスを作成
            checkbox.type = "checkbox";
            checkbox.name = "urlsToDelete";
            checkbox.value = urlData.url;

            const link = document.createElement("a"); // URLリンクを作成
            link.href = urlData.url;
            link.target = "_blank"; // 新しいタブで開く
            link.textContent = urlData.url; // URLテキストを設定
            link.addEventListener("click", () => incrementAccessCount(urlData.url)); // クリック時にアクセス回数を更新

            const dateSpan = document.createElement("span"); // 登録日時を表示する要素を作成
            dateSpan.classList.add("date-info");
            dateSpan.textContent = `登録日時: ${urlData.date}`;

            // URL項目に要素を追加してリストに追加
            urlItem.appendChild(checkbox);
            urlItem.appendChild(link);
            urlItem.appendChild(dateSpan);
            urlList.appendChild(urlItem);
        });
    }

    // ===== 上位アクセスURLを表示エリアに更新 =====
    function updateTopUrls(topUrls) {
        topUrlList.innerHTML = ""; // 現在のリストをクリア
        topUrls.forEach(url => {
            const urlItem = document.createElement("div"); // URL項目を作成
            urlItem.textContent = `${url.url} (アクセス: ${url.count}回)`; // URLとアクセス回数を設定
            topUrlList.appendChild(urlItem); // リストに追加
        });
    }

    // ===== 最近登録されたURLを表示エリアに更新 =====
    function updateRecentUrls(recentUrls) {
        recentUrlList.innerHTML = ""; // 現在のリストをクリア
        recentUrls.forEach(url => {
            const urlItem = document.createElement("div"); // URL項目を作成
            urlItem.textContent = url; // URLを設定
            recentUrlList.appendChild(urlItem); // リストに追加
        });
    }

    // ===== 重複したURLを強調表示し、スクロール =====
    function highlightDuplicateUrl(duplicateIndex) {
        const urlItems = document.querySelectorAll(".url-item"); // URL項目を取得
        const duplicateItem = urlItems[duplicateIndex]; // 重複した項目を取得

        // スクロールして重複項目を表示
        duplicateItem.scrollIntoView({ behavior: "smooth", block: "center" });

        // 点滅用のクラスを追加
        duplicateItem.classList.add("highlight");

        // 3秒後に点滅クラスを削除
        setTimeout(() => {
            duplicateItem.classList.remove("highlight");
        }, 3000);
    }
});
