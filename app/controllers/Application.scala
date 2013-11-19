package controllers

import play.api.mvc._
import com.mongodb.casbah.Imports._
import play.api.Play
import play.api.Play.current

object Application extends Controller {

  val uri = MongoClientURI(Play.configuration.getString("mongodb.uri").get);
  val mongoClient = MongoClient(uri);
  val db = mongoClient("matmaps");
  val coll = db("map");

  def index = Action {
    Ok(views.html.index())
  }

  def newMap = Action {
    var mongoDoc : MongoDBObject = null;
    var mapId : String = null;
    do {
      mapId = RandomString.createRandomString(16);
      mongoDoc = MongoDBObject("id" -> mapId);
    } while (coll.findOne(mongoDoc) isDefined);
    coll.insert( mongoDoc );
    Redirect(routes.Application.getMap(mapId));
  }

  def getMap(id: String) = Action {
    Ok(views.html.newMap());
  }

  def saveMap(id: String, content: String) = Action {
    println(content);
    Ok("");
  }
}