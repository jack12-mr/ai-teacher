# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e13]:
    - generic [ref=e14]:
      - img [ref=e16]
      - generic [ref=e19]: 管理后台
      - generic [ref=e20]: 请输入管理员账号密码登录
    - generic [ref=e22]:
      - generic [ref=e23]:
        - text: 用户名
        - generic [ref=e24]:
          - img [ref=e25]
          - textbox "用户名" [ref=e28]:
            - /placeholder: 请输入用户名
      - generic [ref=e29]:
        - text: 密码
        - generic [ref=e30]:
          - img [ref=e31]
          - textbox "密码" [ref=e34]:
            - /placeholder: 请输入密码
      - button "登录" [ref=e35] [cursor=pointer]
  - region "Notifications alt+T"
```