# Imports
from flask import Flask, request, jsonify
import random
from flask_cors import CORS
from waitress import serve

# from flask_socketio import SocketIO, emit, send
from time import time

# Custom imports
from repositories.DataRepository import DataRepository

# Start app
app = Flask(__name__)

app.config["SECRET_KEY"] = "SongFestival"
# socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

forceSkip, forceRate = False, False
status = -1
rateID = 0
endpoint = "/api/v1"
currentLiedjeID = 0
scoreboard = False

# BACKEND - NIET WIJZIGEN!!
# Deze route wordt gebruikt voor het ophalen van de genres in de keuzelijst


# def update_upload_count():
#     aantal = DataRepository.get_count_liedjes()["aantal"]
#     print(aantal)
#     socketio.emit("B2F_count", {"aantal": aantal}, broadcast=True)


@app.route(endpoint + "/count/")
def update_count():
    aantal = DataRepository.get_count_liedjes()["aantal"]
    return jsonify(count={"aantal": aantal}), 200


# def count_new_rating(id):
#     print("verstuur rating")
#     aantal = DataRepository.get_count_ratings_by_id(id)["aantal"]
#     socketio.emit("B2F_rating_count", {"aantal": aantal, "idLiedje": id})


@app.route(endpoint + "/teacher/rating/count/<id>/")
def get_count_rating(id):
    aantal = DataRepository.get_count_ratings_by_id(id)["aantal"]
    return jsonify(rating={"aantal": aantal, "idLiedje": id}), 200


@app.route(endpoint + "/liedjes/", methods=["GET", "POST", "DELETE"])
def liedje():
    if request.method == "POST":
        gegevens = DataRepository.json_or_formdata(request)
        data = DataRepository.add_liedje(
            gegevens["artiest"], gegevens["titel"], gegevens["url"]
        )
        # update_upload_count()
        if data is not None:
            if data > 0:
                return jsonify(LiedjeID=data), 200
            elif data <= 0:
                return jsonify(status=data), 200
        else:
            return jsonify(message="error"), 404

    elif request.method == "DELETE":
        global status
        status = -1
        # socketio.emit("B2F_user_status", {"status": -1})
        data = DataRepository.delete_all()
        if data is not None:
            if data > 0:
                return jsonify(succes=data), 200

            elif data <= 0:
                return jsonify(status=data), 200
        else:
            return jsonify(message="error"), 404
    elif request.method == "GET":
        data = DataRepository.get_all()
        global scoreboard
        scoreboard = True
        return jsonify(liedjes=data), 200


@app.route(endpoint + "/ratings/<liedje_id>", methods=["GET"])
def get_rating_by_id(liedje_id):
    global forceSkip
    if request.method == "GET":
        forceSkip = True
        data = DataRepository.get_avg_ratings_by_id(liedje_id)
        return jsonify(rating=data), 200


@app.route(endpoint + "/student/forceskip/")
def force_skip():
    global forceSkip
    return jsonify(forceskip=forceSkip), 200


@app.route(endpoint + "/liedje/<liedjeID>/", methods=["GET"])
def get_liedje_by_id(liedjeID):
    global currentLiedjeID
    if request.method == "GET":
        global forceSkip, rateID
        forceSkip = False
        data = DataRepository.get_liedje(liedjeID)
        currentLiedjeID = liedjeID
        rateID = liedjeID
        return jsonify(liedje=data), 200


@app.route(endpoint + "/student/scoreboard/")
def get_scoreboard():
    global scoreboard
    return jsonify(scoreboard={"force": scoreboard}), 200


@app.route(endpoint + "/student/currentsong/")
def new_rate():
    global currentLiedjeID
    return jsonify(currentLiedjeID=currentLiedjeID), 200


@app.route(endpoint + "/eersteID/", methods=["GET"])
def get_eerste_id():
    if request.method == "GET":
        data = DataRepository.get_eerste_liedje()
        if data is not None:
            return jsonify(liedjeID=data), 200
        else:
            return jsonify(message="finished"), 200


@app.route(endpoint + "/liedjes/summary/", methods=["GET"])
def get_summary():
    if request.method == "GET":
        global scoreboard
        scoreboard = True
        data = DataRepository.get_summary()
        return jsonify(liedjes=data), 200


@app.route(endpoint + "/rating/refesh/", methods=["GET"])
def rating_refeshed():
    global rateID
    if request.method == "GET":
        liedjeID = rateID
        # print(liedjeID)
        data = DataRepository.get_liedje(liedjeID)
        # print(data)
        val = {"liedjeID": liedjeID, "Titel": data["Titel"], "Artiest": data["Artiest"]}
        return val, 200


@app.route(endpoint + "/auth/user/")
def authenticate_user():
    global status
    dict_auth = {"type": "student", "status": status}
    return jsonify(auth=dict_auth), 200


@app.route(endpoint + "/auth/teacher/")
def authenticate_teacher():
    global status, forceRate, scoreboard
    forceRate = False
    scoreboard = False
    status = -1
    dict_auth = {"type": "teacher", "status": status, "forcerate": forceRate}
    return jsonify(auth=dict_auth), 200


@app.route(endpoint + "/klaar/")
def iedereen_klaar():
    global status
    status = 0
    return jsonify(status=status), 200


@app.route(endpoint + "/user/waitforstart/")
def wait_for_start():
    global status
    return jsonify(status=status)


@app.route(endpoint + "/student/status/rating/")
def wait_for_status():
    global status
    return jsonify(status=status), 200


# @socketio.on("F2B_rate")
# def rate(id):
#     global status, rateID
#     status = 1
#     liedjeID = id["liedjeID"]
#     rateID = liedjeID
#     print("Er mag nu gerate worden")
#     data = DataRepository.get_liedje(liedjeID)
#     emit(
#         "B2F_Rate",
#         {"liedjeID": liedjeID, "Titel": data["Titel"], "Artiest": data["Artiest"]},
#         broadcast=True,
#     )


# @socketio.on("F2BRate")
# def new_rating(msg):
#     print(msg)
#     DataRepository.add_rating(msg["id"], msg["rating"])
#     count_new_rating(msg["id"])


@app.route(endpoint + "/student/rate/", methods=["POST", "GET"])
def new_rating():
    if request.method == "POST":
        data = DataRepository.json_or_formdata(request)
        response = DataRepository.add_rating(data["id"], data["rating"])
        # count_new_rating(data["id"])
        return jsonify(response=response)
    elif request.method == "GET":
        global currentLiedjeID
        data = DataRepository.get_liedje(currentLiedjeID)

        response = {
            "liedjeID": currentLiedjeID,
            "Titel": data["Titel"],
            "Artiest": data["Artiest"],
        }
        return jsonify(lied=response), 200


# @socketio.on("F2B_start_summary")
# def summary():
#     global status
#     print("Summary")
#     status = 2
#     emit("B2F_finished", broadcast=True)


@app.route(endpoint + "/start/")
def start():
    global status
    status = 0
    return jsonify(status=status)


@app.route(endpoint + "/teacher/continue/")
def continue_teacher():
    global status, forceRate
    status = 1
    forceRate = True
    return jsonify(status=status), 200


@app.route(endpoint + "/student/forcerate/", methods=["GET"])
def forcerate():
    global forceRate
    return jsonify(forcerate=forceRate), 200


# @socketio.on("F2B_start")
# def Start():
#     global status
#     status = 0
#     emit("B2FWaitForStart", broadcast=True)


# @socketio.on("F2B_result_shown")
# def force_skip():
#     emit("b2f_force_skip", broadcast=True)


# Start app
if __name__ == "__main__":
    serve(app, host="0.0.0.0", port=5000)
    # app.run(host="0.0.0.0", port=5000, debug=False)
    # socketio.run(
    #     app,
    #     debug=True,
    #     host="0.0.0.0",
    # )  # (6)
