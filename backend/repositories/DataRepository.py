from .Database import Database
import datetime


class DataRepository:
    @staticmethod
    def json_or_formdata(request):
        if request.content_type == "application/json":
            gegevens = request.get_json()
        else:
            gegevens = request.form.to_dict()
        return gegevens

    # vul hier de verschillende functies aan om je database aan te spreken

    def add_liedje(artiest, Titel, URL):
        sql = "INSERT INTO liedjes (Artiest, Titel, inleverDatum, URL) values (%s, %s, %s,%s)"
        now = datetime.datetime.now()
        sqlTime = now.strftime("%Y-%m-%d %H:%M:%S")
        params = [artiest, Titel, sqlTime, URL]
        return Database.execute_sql(sql, params)

    def delete_all():
        sql = "DELETE FROM liedjes"
        return Database.execute_sql(sql)

    def get_all():
        sql = "SELECT  * FROM liedjes"
        return Database.get_rows(sql)

    def get_liedje(LiedjeID):
        sql = "SELECT * FROM liedjes WHERE idLiedjes = %s"
        params = [LiedjeID]
        return Database.get_one_row(sql, params)

    def get_count_liedjes():
        sql = "SELECT count(*) as aantal from liedjes"
        return Database.get_one_row(sql)

    def add_rating(idLiedje, rating):
        sql = "INSERT INTO rating (rating, idLiedje) values  (%s,%s)"
        params = [rating, idLiedje]
        return Database.execute_sql(sql, params)

    def get_count_ratings_by_id(id):
        sql = "SELECT COUNT(*) AS aantal from rating where idLiedje = %s"
        params = [id]
        return Database.get_one_row(sql, params)

    def get_avg_ratings_by_id(id):
        sql = "SELECT avg(rating) AS aantal from rating where idLiedje = %s"
        params = [id]
        return Database.get_one_row(sql, params)

    def get_eerste_liedje():
        sql = "SELECT idLiedjes from liedjes ORDER BY idLiedjes ASC limit 1"
        return Database.get_one_row(sql)

    def get_summary():
        sql = "SELECT l.idliedjes, l.titel, l.artiest, avg(r.rating) as rating from liedjes l join rating r on r.idLiedje = l.idLiedjes group by idLiedjes order by rating desc"
        return Database.get_rows(sql)
