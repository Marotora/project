<?php
// タイムゾーンの設定（日本時間に設定）
date_default_timezone_set('Asia/Tokyo');

// URLデータを保存するJSONファイル
$file = 'urls.json';

// ===== URLデータを取得する関数 =====
function getUrls() {
    global $file;

    // ファイルが存在しない場合、空配列を返す
    if (!file_exists($file)) {
        return [];
    }

    // JSONファイルが存在すれば読み込んでデコードする（配列として返す）
    return file_exists($file) ? json_decode(file_get_contents($file), true) : [];

    // 連想配列で読み込まれた場合に配列の形式に変換
    return array_values($urls);
}

// ===== URLデータを保存する関数 =====
function saveUrls($urls) {
    global $file;
    // 配列をJSON形式にエンコードしてファイルに保存する
    file_put_contents($file, json_encode($urls));
}

// ===== アクセス回数が多い上位3つのURLを取得する関数 =====
function getTopUrls($urls) {
    // アクセス回数で降順ソートし、上位3件を返す
    usort($urls, fn($a, $b) => $b['count'] - $a['count']);
    return array_slice($urls, 0, 3);
}

// ===== 最近登録された上位3つのURLを取得する関数 =====
function getRecentUrls($urls) {
    // 登録日時で降順ソートし、上位3件のURLだけを返す
    usort($urls, fn($a, $b) => strtotime($b['date']) - strtotime($a['date']));
    return array_slice(array_column($urls, 'url'), 0, 3);
}

// ===== リクエストがPOSTの場合の処理 =====
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $urls = getUrls(); // 既存のURLリストを取得

    // ----- URL登録の処理 -----
    if ($_POST['action'] === 'register' && !empty($_POST['url'])) {
        $newUrl = $_POST['url']; // 新しいURLを取得
        // すでに登録済みのURLがあるか確認（インデックスを取得）
        $duplicateIndex = array_search($newUrl, array_column($urls, 'url'));

        // 重複がなければ新しいURLを追加
        if ($duplicateIndex === false) {
            $urls[] = ['url' => $newUrl, 'count' => 0, 'date' => date('Y-m-d H:i:s')];
        }

        // 更新したURLリストを保存
        saveUrls($urls);

        // 登録結果を返す（JSON形式）
        $response = [
            'urls' => $urls,
            'topUrls' => getTopUrls($urls),
            'recentUrls' => getRecentUrls($urls),
            'duplicateIndex' => $duplicateIndex === false ? null : $duplicateIndex,
        ];
        header('Content-Type: application/json');
        echo json_encode($response);
        exit;
    }

    // ----- URL削除の処理 -----
    if ($_POST['action'] === 'delete' && isset($_POST['urlsToDelete'])) {
        // 削除対象のURLリストを取得
        $urlsToDelete = $_POST['urlsToDelete'];
        // 対象URLを削除し、リストを更新
        $urls = array_filter($urls, fn($url) => !in_array($url['url'], $urlsToDelete));
        $urls = array_values($urls); // インデックスをリセット
        saveUrls($urls);

        // 更新結果を返す（JSON形式）
        $response = [
            'urls' => $urls,
            'topUrls' => getTopUrls($urls),
            'recentUrls' => getRecentUrls($urls),
        ];
        header('Content-Type: application/json');
        echo json_encode($response);
        exit;
    }

    // ----- URLアクセス回数の更新処理 -----
    if ($_POST['action'] === 'increment' && !empty($_POST['url'])) {
        // 指定されたURLのアクセス回数を1増やす
        foreach ($urls as &$url) {
            if ($url['url'] === $_POST['url']) {
                $url['count']++;
                break;
            }
        }
        saveUrls($urls);

        // 更新結果を返す（JSON形式）
        $response = [
            'topUrls' => getTopUrls($urls),
        ];
        header('Content-Type: application/json');
        echo json_encode($response);
        exit;
    }

        // メモ保存処理
    if ($_POST['action'] === 'saveMemo' && !empty($_POST['url']) && isset($_POST['memo'])) {
        $urls = getUrls();
        foreach ($urls as &$url) {
            if ($url['url'] === $_POST['url']) {
                $url['memo'] = $_POST['memo']; // メモを更新
                break;
            }
        }
        saveUrls($urls);

        header('Content-Type: application/json');
        echo json_encode(['status' => 'success']);
        exit;
    }
}

// ===== リクエストがGETの場合の処理 =====
if ($_GET['action'] === 'fetch') {
    $urls = getUrls(); // URLリストを取得

    // 初期表示用のデータを返す（JSON形式）
    $response = [
        'urls' => $urls,
        'topUrls' => getTopUrls($urls),
        'recentUrls' => getRecentUrls($urls),
    ];
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
$response = [
    'urls' => getUrls(), // 配列である必要がある
    'topUrls' => getTopUrls($urls),
    'recentUrls' => getRecentUrls($urls),
];
header('Content-Type: application/json');
echo json_encode($response);

?>
