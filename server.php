<?php
date_default_timezone_set('Asia/Tokyo'); // 日本時間を設定

$file = 'urls.json';

// URLデータを取得する関数
function getUrls() {
    global $file;
    return file_exists($file) ? json_decode(file_get_contents($file), true) : [];
}

// URLデータを保存する関数
function saveUrls($urls) {
    global $file;
    file_put_contents($file, json_encode($urls));
}

// アクセス回数が多い上位3つのURLを取得する関数
function getTopUrls($urls) {
    usort($urls, fn($a, $b) => $b['count'] - $a['count']);
    return array_slice($urls, 0, 3);
}

// 最近登録された上位3つのURLを取得する関数
function getRecentUrls($urls) {
    usort($urls, fn($a, $b) => strtotime($b['date']) - strtotime($a['date']));
    return array_slice(array_column($urls, 'url'), 0, 3);
}

// POSTリクエストの処理
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $urls = getUrls();

    // URLを登録する処理
    if ($_POST['action'] === 'register' && !empty($_POST['url'])) {
        $newUrl = $_POST['url'];

        // 重複チェック
        $existingUrlIndex = array_search($newUrl, array_column($urls, 'url'));
        if ($existingUrlIndex !== false) {
            // 重複URLがあった場合、エラーメッセージを返す
            $response['error'] = "同じURLが既に登録されています。";
            $response['duplicateIndex'] = $existingUrlIndex; // 重複URLのインデックスを返す
        } else {
            // 重複がない場合、新しいURLを追加
            $urls[] = ['url' => $newUrl, 'count' => 0, 'date' => date('Y-m-d H:i:s')];
            saveUrls($urls);
            $response['urls'] = $urls;
        }
    }

    // URLを削除する処理
    if ($_POST['action'] === 'delete' && isset($_POST['urlsToDelete'])) {
        $urlsToDelete = $_POST['urlsToDelete'];
        $urls = array_filter($urls, fn($url) => !in_array($url['url'], $urlsToDelete));
        saveUrls(array_values($urls));
    }

    // URLのアクセス回数をインクリメントする処理
    if ($_POST['action'] === 'increment' && !empty($_POST['url'])) {
        foreach ($urls as &$url) {
            if ($url['url'] === $_POST['url']) {
                $url['count']++;
                break;
            }
        }
        saveUrls($urls);
    }

    // レスポンスデータを準備
    $response['topUrls'] = getTopUrls($urls);
    $response['recentUrls'] = getRecentUrls($urls);

    // JSON形式でレスポンスを返す
    header('Content-Type: application/json');
    echo json_encode($response);
}

// GETリクエストの処理（初期表示データを取得）
elseif ($_GET['action'] === 'fetch') {
    $urls = getUrls();

    $response = [
        'urls' => $urls,
        'topUrls' => getTopUrls($urls),
        'recentUrls' => getRecentUrls($urls),
    ];

    // JSON形式でレスポンスを返す
    header('Content-Type: application/json');
    echo json_encode($response);
}
?>
