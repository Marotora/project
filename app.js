document.addEventListener("DOMContentLoaded", function() {
    const registerForm = document.getElementById("registerForm");
    const deleteForm = document.getElementById("deleteForm");
    const urlInput = document.getElementById("urlInput");
    const urlList = document.getElementById("urlList");
    const topUrlList = document.getElementById("topUrlList");
    const recentUrlList = document.getElementById("recentUrlList");
    const errorMessage = document.getElementById("errorMessage"); // エラーメッセージ用

    // 初期表示でURL一覧を取得
    fetchUrlList();

    // URLの登録
    registerForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const url = urlInput.value;
        if (url) {
            const formData = new FormData();
            formData.append("action", "register");
            formData.append("url", url);

            fetch("server.php", {
                method: "POST",
                body: formData
            }).then(response => response.json())
                .then(data => {
                    if (data.error) {
                        // 重複URLの場合、エラーメッセージを表示
                        errorMessage.textContent = data.error;
                        errorMessage.style.display = "block";
                        // 重複したURLに自動スクロールと強調表示を適用
                        highlightDuplicateUrl(data.duplicateIndex);
                    } else {
                        // 登録が成功した場合
                        errorMessage.style.display = "none";
                        urlInput.value = "";
                        updateUrlList(data.urls);
                        updateTopUrls(data.topUrls);
                        updateRecentUrls(data.recentUrls);
                    }
                });
        }
    });

    // URLの削除
    deleteForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const checkedUrls = Array.from(document.querySelectorAll("input[name='urlsToDelete']:checked"))
                                .map(input => input.value);

        if (checkedUrls.length > 0) {
            const formData = new FormData();
            formData.append("action", "delete");
            checkedUrls.forEach(url => formData.append("urlsToDelete[]", url));

            fetch("server.php", {
                method: "POST",
                body: formData
            }).then(response => response.json())
                .then(data => {
                    updateUrlList(data.urls);
                    updateTopUrls(data.topUrls);
                    updateRecentUrls(data.recentUrls);
                });
        }
    });

    // URL一覧の表示更新
    function updateUrlList(urls) {
        urlList.innerHTML = "";
        urls.forEach((urlData, index) => {
            const urlItem = document.createElement("div");
            urlItem.classList.add("url-item");
            urlItem.dataset.index = index;  // インデックスをデータ属性に追加

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "urlsToDelete";
            checkbox.value = urlData.url;

            const link = document.createElement("a");
            link.href = urlData.url;
            link.target = "_blank";
            link.textContent = urlData.url;
            link.addEventListener("click", () => incrementAccessCount(urlData.url));

            const dateSpan = document.createElement("span");
            dateSpan.classList.add("date-info");
            dateSpan.textContent = `登録日時: ${urlData.date}`;

            urlItem.appendChild(checkbox);
            urlItem.appendChild(link);
            urlItem.appendChild(dateSpan);
            urlList.appendChild(urlItem);
        });
    }

    // 上位アクセスの多いURL表示
    function updateTopUrls(topUrls) {
        topUrlList.innerHTML = "";
        topUrls.forEach(url => {
            const urlItem = document.createElement("div");
            urlItem.textContent = `${url.url} (アクセス: ${url.count}回)`;
            topUrlList.appendChild(urlItem);
        });
    }

    // 最近登録したURL表示
    function updateRecentUrls(recentUrls) {
        recentUrlList.innerHTML = "";
        recentUrls.forEach(url => {
            const urlItem = document.createElement("div");
            urlItem.textContent = url;
            recentUrlList.appendChild(urlItem);
        });
    }

    // URLアクセス回数の更新
    function incrementAccessCount(url) {
        const formData = new FormData();
        formData.append("action", "increment");
        formData.append("url", url);

        fetch("server.php", {
            method: "POST",
            body: formData
        }).then(response => response.json())
            .then(data => {
                updateTopUrls(data.topUrls);
            });
    }

    // URL一覧をサーバーから取得
    function fetchUrlList() {
        fetch("server.php?action=fetch")
            .then(response => response.json())
            .then(data => {
                updateUrlList(data.urls);
                updateTopUrls(data.topUrls);
                updateRecentUrls(data.recentUrls);
            });
    }

    // 重複したURLを強調表示＆自動スクロール
    function highlightDuplicateUrl(duplicateIndex) {
        const urlItems = document.querySelectorAll(".url-item");
        const duplicateItem = urlItems[duplicateIndex];

        // スクロールして重複したURLを表示
        duplicateItem.scrollIntoView({ behavior: "smooth", block: "center" });

        // 重複URLを点滅させる
        duplicateItem.classList.add("highlight");
        
        // 点滅後、クラスを削除して強調表示を解除
        setTimeout(() => {
            duplicateItem.classList.remove("highlight");
        }, 3000); // 3秒後に点滅を停止
    }
});
