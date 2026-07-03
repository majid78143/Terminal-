"""
LiveHTML Pro - Flask Edition
Ek hi Flask server jo editor page serve karta hai.
Poora editor, live preview aur console browser me hi (client-side JS) chalta hai,
isliye server bahut simple rakha gaya hai.
"""

from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def index():
    """Main aur ek-hi page - editor + live preview + console yahin hai."""
    return render_template("index.html")


if __name__ == "__main__":
    # host=0.0.0.0 zaroori hai taaki Replit/other hosting me bhi chal jaaye
    app.run(host="0.0.0.0", port=5000, debug=True)
