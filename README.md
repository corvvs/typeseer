# TypeSeer

1つ以上のJSONデータから, 全体に適合するTypeScript型定義を生成する。

## Options

- `-t, --use-tab` インデントでタブを使用するか; デフォルトはNo(スペースを使用する)
- `-s, --spaces <spacedForTab>` インデント1段階で使用するスペースの数; デフォルトは4
- `-d ,--dict-key <keypath>` (複数回指定可能) 指定keypathの値がオブジェクトの場合, 辞書と考える
- `-e ,--enum-key <keypath>` (複数回指定可能) 指定keypathの値が文字列の場合, Enumと考える
- `-e ,--union-by <keypath1>:<keypath1>` (複数回指定可能) keypath1の値を, keypath2の値を基準にしたUnionとする
- `--exclude-key <keypath>` (複数回指定可能) 指定keypathの値を除外する
- `--include-key <keypath>` (複数回指定可能) 指定keypathの値を除外しない; 上位のkeypathが除外されている場合のみ意味がある


## 例

```
$ <<EOF node dist/index.js 
> [1, 2, "hello, world"]
> EOF
type JSON = string | number;
```

```
$ <<EOF node dist/index.js 
> [[1,2,3], { "hello": "world" }]
> EOF
type JSON = Array<number> | {
    hello: string;
};
```

```
$ curl https://api.nobelprize.org/v1/laureate.json | node dist/index.js 
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  484k    0  484k    0     0  3098k      0 --:--:-- --:--:-- --:--:-- 3169k
Warning: Input is not an array, wrapping it in an array
type JSON = {
    laureates: Array<{
        born?:            string;
        bornCity?:        string;
        bornCountry?:     string;
        bornCountryCode?: string;
        died:             string;
        diedCity?:        string;
        diedCountry?:     string;
        diedCountryCode?: string;
        firstname:        string;
        gender:           string;
        id:               string;
        prizes: Array<{
            affiliations: Array<Array<any> | {
                city?:    string;
                country?: string;
                name:     string;
            }>;
            category:           string;
            motivation:         string;
            overallMotivation?: string;
            share:              string;
            year:               string;
        }>;
        surname?: string;
    }>;
};
```

```
$ curl 'https://www.govtrack.us/api/v2/role?current=true&role_type=senator' | node dist/index.js 
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  139k  100  139k    0     0   101k      0  0:00:01  0:00:01 --:--:--  101k
Warning: Input is not an array, wrapping it in an array
type JSON = {
    meta: {
        limit:       number;
        offset:      number;
        total_count: number;
    };
    objects: Array<{
        caucus:           string | null;
        congress_numbers: Array<number>;
        current:          boolean;
        description:      string;
        district:         null;
        enddate:          string;
        extra: {
            address:       string;
            contact_form?: string;
            "end-type"?:   string;
            how?:          string;
            office:        string;
            rss_url?:      string;
        };
        leadership_title: null;
        party:            string;
        person: {
            bioguideid:          string;
            birthday:            string;
            cspanid:             number | null;
            fediverse_webfinger: null;
            firstname:           string;
            gender:              string;
            gender_label:        string;
            lastname:            string;
            link:                string;
            middlename:          string;
            name:                string;
            namemod:             string;
            nickname:            string;
            osid:                string | null;
            pvsid:               null;
            sortname:            string;
            twitterid:           string | null;
            youtubeid:           string | null;
        };
        phone:               string;
        role_type:           string;
        role_type_label:     string;
        senator_class:       string;
        senator_class_label: string;
        senator_rank:        string;
        senator_rank_label:  string;
        startdate:           string;
        state:               string;
        title:               string;
        title_long:          string;
        website:             string;
    }>;
};
```
